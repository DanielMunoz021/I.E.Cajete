<?php
// Archivos subidos (PDF e imágenes).
// - Se validan por extensión Y por tipo MIME real (finfo); las imágenes, además, con getimagesize.
// - Se guardan con nombre aleatorio en uploads/ (fuera de public_html; .htaccess impide servirlos o ejecutarlos).
// - Se entregan solo por GET /api/archivo/{id}, que revisa permisos.
declare(strict_types=1);

const TIPOS_PERMITIDOS = [
    'pdf'    => ['ext' => ['pdf'], 'mime' => ['application/pdf']],
    'imagen' => ['ext' => ['jpg', 'jpeg', 'png', 'webp'], 'mime' => ['image/jpeg', 'image/png', 'image/webp']],
];

function hay_archivo(string $campo): bool
{
    return isset($_FILES[$campo]) && ($_FILES[$campo]['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;
}

/** Valida y guarda el archivo del campo $campo. Devuelve el id en la tabla archivos. */
function guardar_subida(string $campo, string $tipo, int $usuarioId): int
{
    $f = $_FILES[$campo] ?? null;
    $etiqueta = $tipo === 'pdf' ? 'El PDF' : 'La imagen';
    $maxMb = (int) config($tipo === 'pdf' ? 'max_pdf_mb' : 'max_imagen_mb', $tipo === 'pdf' ? 20 : 5);

    if (!$f || !is_array($f) || is_array($f['error'])) {
        invalido($campo, "$etiqueta es obligatorio.");
    }
    if (in_array($f['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) || $f['size'] > $maxMb * 1024 * 1024) {
        invalido($campo, "$etiqueta supera el tamaño máximo de $maxMb MB.");
    }
    if ($f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) {
        invalido($campo, "No se pudo recibir $etiqueta. Inténtalo de nuevo.");
    }
    if ($f['size'] === 0) {
        invalido($campo, "$etiqueta está vacío.");
    }

    $reglas = TIPOS_PERMITIDOS[$tipo];
    $nombreOriginal = mb_substr(basename((string) $f['name']), 0, 200);
    $ext = strtolower(pathinfo($nombreOriginal, PATHINFO_EXTENSION));
    if (!in_array($ext, $reglas['ext'], true)) {
        invalido($campo, "$etiqueta debe ser " . implode(', ', array_map('strtoupper', $reglas['ext'])) . '.');
    }
    // Tipo real según el contenido, no según lo que dice el navegador.
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']) ?: '';
    if (!in_array($mime, $reglas['mime'], true)) {
        invalido($campo, "El contenido de $etiqueta no corresponde a un archivo " . ($tipo === 'pdf' ? 'PDF' : 'de imagen') . ' válido.');
    }
    if ($tipo === 'pdf' && file_get_contents($f['tmp_name'], false, null, 0, 5) !== '%PDF-') {
        invalido($campo, 'El archivo no es un PDF válido.');
    }
    if ($tipo === 'imagen' && @getimagesize($f['tmp_name']) === false) {
        invalido($campo, 'La imagen está dañada o no es válida.');
    }

    $extFinal = $tipo === 'pdf' ? 'pdf' : ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$mime];
    $relativa = sprintf('%s/%s/%s.%s', $tipo, date('Y/m'), bin2hex(random_bytes(16)), $extFinal);
    $destino = uploads_dir() . '/' . $relativa;
    if (!is_dir(dirname($destino)) && !mkdir(dirname($destino), 0755, true) && !is_dir(dirname($destino))) {
        throw new RuntimeException('No se pudo crear la carpeta de uploads.');
    }
    if (!move_uploaded_file($f['tmp_name'], $destino)) {
        throw new RuntimeException('No se pudo guardar el archivo subido.');
    }
    @chmod($destino, 0644);

    q(
        'INSERT INTO archivos (tipo, ruta_interna, nombre_original, mime, tamano, subido_por) VALUES (?, ?, ?, ?, ?, ?)',
        [$tipo, $relativa, $nombreOriginal, $mime, (int) $f['size'], $usuarioId]
    );
    return ultimo_id();
}

function uploads_dir(): string
{
    return rtrim((string) config('uploads_dir', RAIZ_PRIVADA . '/uploads'), '/\\');
}

/** Borra el archivo físico y su fila (solo si ya nada lo usa). */
function borrar_archivo(?int $id): void
{
    if (!$id) {
        return;
    }
    $usos = (int) valor(
        'SELECT (SELECT COUNT(*) FROM semilleros WHERE imagen_id = ?) + (SELECT COUNT(*) FROM proyectos WHERE imagen_id = ?)
              + (SELECT COUNT(*) FROM documentos WHERE archivo_id = ?)
              + (SELECT COUNT(*) FROM ediciones_sensaciones WHERE portada_id = ? OR pdf_id = ?)',
        array_fill(0, 5, $id)
    );
    if ($usos > 0) {
        return;
    }
    $ruta = valor('SELECT ruta_interna FROM archivos WHERE id = ?', [$id]);
    q('DELETE FROM archivos WHERE id = ?', [$id]);
    if (is_string($ruta) && $ruta !== '' && !str_contains($ruta, '..')) {
        @unlink(uploads_dir() . '/' . $ruta);
    }
}

/** URL pública (relativa al sitio) de un archivo. */
function url_archivo(?int $id): ?string
{
    return $id ? "api/archivo/$id" : null;
}

/** Si la petición superó post_max_size, PHP descarta todo: se avisa con un mensaje claro. */
function verificar_tamano_peticion(): void
{
    $largo = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    $max = ini_bytes((string) ini_get('post_max_size'));
    if ($max > 0 && $largo > $max) {
        error_api('El archivo es demasiado grande para el servidor (máximo ' . ini_get('post_max_size') . ').', 413);
    }
}

function ini_bytes(string $v): int
{
    $v = trim($v);
    $n = (int) $v;
    return match (strtolower(substr($v, -1))) {
        'g' => $n * 1024 ** 3,
        'm' => $n * 1024 ** 2,
        'k' => $n * 1024,
        default => $n,
    };
}

/** Texto URL-amigable y único en la tabla dada. */
function slug_unico(string $tabla, string $texto, ?int $excluirId = null): string
{
    // Transliteración propia (iconv da resultados distintos según el sistema operativo).
    $sinTildes = strtr(mb_strtolower($texto), [
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n',
        'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u', 'ç' => 'c',
    ]);
    $base = trim((string) preg_replace('/[^a-z0-9]+/', '-', $sinTildes), '-');
    $base = substr($base !== '' ? $base : 'item', 0, 150);
    $slug = $base;
    for ($i = 2; ; $i++) {
        $existe = $excluirId
            ? valor("SELECT 1 FROM $tabla WHERE slug = ? AND id <> ?", [$slug, $excluirId])
            : valor("SELECT 1 FROM $tabla WHERE slug = ?", [$slug]);
        if (!$existe) {
            return $slug;
        }
        $slug = "$base-$i";
    }
}
