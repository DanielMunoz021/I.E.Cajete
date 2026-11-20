<?php
// Respuestas JSON, lectura de la petición y manejo de errores.
declare(strict_types=1);

function config(string $clave, mixed $porDefecto = null): mixed
{
    return $GLOBALS['CONFIG'][$clave] ?? $porDefecto;
}

function es_desarrollo(): bool
{
    return config('entorno') === 'desarrollo';
}

function responder(mixed $datos, int $codigo = 200): never
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function error_api(string $mensaje, int $codigo = 400, array $extra = []): never
{
    responder(['error' => $mensaje] + $extra, $codigo);
}

/** Datos de la petición: cuerpo JSON, o los campos del formulario si es multipart (subida de archivos). */
function entrada(): array
{
    static $datos = null;
    if ($datos !== null) {
        return $datos;
    }
    if (str_starts_with((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'multipart/form-data')) {
        return $datos = $_POST;
    }
    $crudo = file_get_contents('php://input') ?: '';
    if ($crudo === '') {
        return $datos = [];
    }
    $json = json_decode($crudo, true);
    if (!is_array($json)) {
        error_api('El cuerpo de la petición no es JSON válido.');
    }
    return $datos = $json;
}

function cabeceras_seguridad_api(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: same-origin');
    header('Cache-Control: no-store');
}

function configurar_errores(): void
{
    error_reporting(E_ALL);
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');

    set_error_handler(function (int $nivel, string $mensaje, string $archivo, int $linea): bool {
        throw new ErrorException($mensaje, 0, $nivel, $archivo, $linea);
    });

    set_exception_handler(function (Throwable $e): void {
        error_log('[portal-iecajete] ' . $e::class . ': ' . $e->getMessage() . ' en ' . $e->getFile() . ':' . $e->getLine());
        $extra = es_desarrollo() ? ['detalle' => $e->getMessage(), 'lugar' => basename($e->getFile()) . ':' . $e->getLine()] : [];
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
        }
        http_response_code(500);
        echo json_encode(['error' => 'Ocurrió un error en el servidor.'] + $extra, JSON_UNESCAPED_UNICODE);
    });
}

function ip_cliente(): string
{
    // En hosting compartido se usa REMOTE_ADDR (las cabeceras X-Forwarded-For se pueden falsificar).
    return substr((string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'), 0, 45);
}
