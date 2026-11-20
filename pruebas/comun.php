<?php
// Utilidades para las pruebas de la API (cliente HTTP con cookies y aserciones).
declare(strict_types=1);

const API = 'http://127.0.0.1:8000';
define('CONFIG', require __DIR__ . '/../privado/config.php');

$GLOBALS['fallos'] = 0;
$GLOBALS['total'] = 0;

/** Vacía la base local. Exige entorno de desarrollo, host local y la bandera explícita. */
function preparar_base_vacia(array $argv): void
{
    if (!in_array('--borrar-datos-locales', $argv, true)) {
        fwrite(STDERR, "Esta prueba BORRA los datos de la base local. Ejecútala con --borrar-datos-locales\n");
        exit(2);
    }
    $bd = CONFIG['bd'];
    if ((CONFIG['entorno'] ?? '') !== 'desarrollo' || !in_array($bd['host'], ['127.0.0.1', 'localhost'], true)) {
        fwrite(STDERR, "Negado: solo se ejecuta con entorno 'desarrollo' y base de datos local.\n");
        exit(2);
    }
    $pdo = new PDO("mysql:host={$bd['host']};port={$bd['puerto']};dbname={$bd['nombre']};charset=utf8mb4", $bd['usuario'], $bd['clave']);
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    foreach (['destacados', 'documentos', 'proyectos', 'semillero_docentes', 'semilleros', 'ediciones_sensaciones', 'archivos', 'intentos_login', 'usuarios'] as $t) {
        $pdo->exec("TRUNCATE TABLE $t");
    }
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
}

function pdo_local(): PDO
{
    $bd = CONFIG['bd'];
    return new PDO("mysql:host={$bd['host']};port={$bd['puerto']};dbname={$bd['nombre']};charset=utf8mb4", $bd['usuario'], $bd['clave'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
}

/** Crea un usuario directo en la base (para preparar escenarios) y devuelve su id. */
function crear_usuario(string $nombre, string $correo, string $clave, string $rol): int
{
    $pdo = pdo_local();
    $pdo->prepare('INSERT INTO usuarios (nombre, correo, rol, clave_hash, debe_cambiar_clave, activo) VALUES (?, ?, ?, ?, 0, 1)')
        ->execute([$nombre, $correo, $rol, password_hash($clave, PASSWORD_DEFAULT)]);
    return (int) $pdo->lastInsertId();
}

/** Cliente ya autenticado. */
function cliente_con_sesion(string $correo, string $clave): Cliente
{
    $c = new Cliente();
    $c->get('/sesion');
    $r = $c->post('/login', ['correo' => $correo, 'clave' => $clave]);
    if ($r['estado'] !== 200) {
        fwrite(STDERR, "No se pudo iniciar sesión como $correo: {$r['cuerpo']}\n");
        exit(1);
    }
    return $c;
}

/** Archivos de prueba en una carpeta temporal. */
function archivos_de_prueba(): array
{
    $dir = sys_get_temp_dir() . '/iecajete-pruebas';
    @mkdir($dir);
    // PDF mínimo válido
    $pdf = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n";
    file_put_contents("$dir/informe.pdf", $pdf);
    file_put_contents("$dir/falso.pdf", "Esto es texto, no un PDF.\n");
    file_put_contents("$dir/ataque.jpg", "<?php echo 'hackeado'; ?>");
    $img = imagecreatetruecolor(40, 30);
    imagefill($img, 0, 0, imagecolorallocate($img, 0, 122, 82));
    imagepng($img, "$dir/foto.png");
    return [
        'pdf'    => ["$dir/informe.pdf", 'application/pdf', 'informe.pdf'],
        'falso'  => ["$dir/falso.pdf", 'application/pdf', 'falso.pdf'],
        'ataque' => ["$dir/ataque.jpg", 'image/jpeg', 'ataque.jpg'],
        'png'    => ["$dir/foto.png", 'image/png', 'foto.png'],
    ];
}

final class Cliente
{
    private string $cookies;
    public string $csrf = '';

    public function __construct()
    {
        $this->cookies = tempnam(sys_get_temp_dir(), 'cookies');
    }

    public function __destruct()
    {
        @unlink($this->cookies);
    }

    public function crudo(string $metodo, string $ruta, ?string $cuerpo = null, array $cabeceras = []): string
    {
        return $this->enviar($metodo, $ruta, $cuerpo, $cabeceras)['cuerpo'];
    }

    public function formulario(string $ruta, array $campos): string
    {
        return $this->crudo('POST', $ruta, http_build_query($campos), ['Content-Type: application/x-www-form-urlencoded']);
    }

    public function get(string $ruta): array
    {
        return $this->json('GET', $ruta);
    }

    public function post(string $ruta, array $datos = [], bool $conCsrf = true): array
    {
        return $this->json('POST', $ruta, $datos, $conCsrf);
    }

    public function put(string $ruta, array $datos = []): array
    {
        return $this->json('PUT', $ruta, $datos);
    }

    public function delete(string $ruta): array
    {
        return $this->json('DELETE', $ruta);
    }

    /** Multipart (subida de archivos). $archivos = ['campo' => ruta_local]. */
    public function subir(string $ruta, array $campos, array $archivos): array
    {
        $datos = $campos;
        foreach ($archivos as $campo => [$rutaLocal, $mime, $nombre]) {
            $datos[$campo] = new CURLFile($rutaLocal, $mime, $nombre);
        }
        $r = $this->enviar('POST', "/api$ruta", $datos, ['X-CSRF-Token: ' . $this->csrf], multipart: true);
        return $this->interpretar($r);
    }

    private function json(string $metodo, string $ruta, ?array $datos = null, bool $conCsrf = true): array
    {
        $cab = ['Content-Type: application/json', 'Accept: application/json'];
        if ($metodo !== 'GET' && $conCsrf) {
            $cab[] = 'X-CSRF-Token: ' . $this->csrf;
        }
        $r = $this->enviar($metodo, "/api$ruta", $datos === null ? null : json_encode($datos), $cab);
        return $this->interpretar($r);
    }

    private function interpretar(array $r): array
    {
        $json = json_decode($r['cuerpo'], true);
        if (is_array($json) && isset($json['csrf'])) {
            $this->csrf = $json['csrf'];
        }
        return ['estado' => $r['estado'], 'json' => $json, 'cuerpo' => $r['cuerpo'], 'tipo' => $r['tipo']];
    }

    private function enviar(string $metodo, string $ruta, string|array|null $cuerpo, array $cabeceras, bool $multipart = false): array
    {
        $ch = curl_init(API . $ruta);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST  => $metodo,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_COOKIEJAR      => $this->cookies,
            CURLOPT_COOKIEFILE     => $this->cookies,
            CURLOPT_HTTPHEADER     => $cabeceras,
            CURLOPT_TIMEOUT        => 30,
        ]);
        if ($cuerpo !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $cuerpo);
        }
        $cuerpoResp = (string) curl_exec($ch);
        $estado = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $tipo = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        return ['estado' => $estado, 'cuerpo' => $cuerpoResp, 'tipo' => $tipo];
    }
}

function titulo(string $t): void
{
    echo "\n== $t\n";
}

function ok(bool $condicion, string $descripcion): void
{
    $GLOBALS['total']++;
    if ($condicion) {
        echo "  [OK]    $descripcion\n";
    } else {
        $GLOBALS['fallos']++;
        echo "  [FALLA] $descripcion\n";
    }
}

function resumen_final(): never
{
    $t = $GLOBALS['total'];
    $f = $GLOBALS['fallos'];
    echo "\n" . ($f === 0 ? "TODO BIEN: $t de $t pruebas pasaron.\n" : "FALLARON $f de $t pruebas.\n");
    exit($f === 0 ? 0 : 1);
}
