<?php
// GET /api/archivo/{id}: entrega un archivo subido, revisando permisos.
// Público si pertenece a contenido publicado; si no, solo para el admin o quien lo subió.
declare(strict_types=1);

function archivo_es_publico(int $id): bool
{
    return (bool) valor(
        "SELECT 1 FROM semilleros WHERE imagen_id = ? AND activo = 1
         UNION SELECT 1 FROM proyectos p JOIN semilleros s ON s.id = p.semillero_id
               WHERE p.imagen_id = ? AND p.revision = 'aprobado' AND s.activo = 1
         UNION SELECT 1 FROM documentos WHERE archivo_id = ? AND revision = 'aprobado'
         UNION SELECT 1 FROM ediciones_sensaciones WHERE (portada_id = ? OR pdf_id = ?) AND publicada = 1
         LIMIT 1",
        array_fill(0, 5, $id)
    );
}

function ruta_archivo(int $id): never
{
    $a = fila('SELECT * FROM archivos WHERE id = ?', [$id]);
    if (!$a) {
        error_api('El archivo no existe.', 404);
    }
    $publico = archivo_es_publico($id);
    if (!$publico) {
        $u = usuario_actual();
        $permitido = $u && !(int) $u['debe_cambiar_clave'] && ($u['rol'] === 'admin' || (int) $a['subido_por'] === (int) $u['id']);
        if (!$permitido) {
            error_api('El archivo no existe.', 404); // no se revela que existe un archivo no publicado
        }
    }

    $ruta = uploads_dir() . '/' . $a['ruta_interna'];
    if (str_contains($a['ruta_interna'], '..') || !is_file($ruta)) {
        error_api('El archivo no está disponible.', 404);
    }

    $descargar = isset($_GET['descargar']);
    $nombre = preg_replace('/[^\w.\- ]+/u', '_', $a['nombre_original']) ?: 'archivo';
    header_remove('Content-Type');
    header('Content-Type: ' . $a['mime']);
    header('Content-Length: ' . filesize($ruta));
    header('X-Content-Type-Options: nosniff');
    header("Content-Disposition: " . ($descargar ? 'attachment' : 'inline') . "; filename=\"$nombre\"; filename*=UTF-8''" . rawurlencode($a['nombre_original']));
    header('Cache-Control: ' . ($publico ? 'public, max-age=86400' : 'private, no-store'));
    readfile($ruta);
    exit;
}
