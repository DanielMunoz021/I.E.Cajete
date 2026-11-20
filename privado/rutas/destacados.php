<?php
// Destacados de la página de inicio: cualquier semillero, proyecto, PDF o edición de Sensaciones.
declare(strict_types=1);

const TIPOS_DESTACADO = ['semillero', 'proyecto', 'documento', 'edicion'];

/**
 * Resuelve un destacado a lo que se muestra en el inicio.
 * Devuelve null si el elemento ya no existe o no está publicado.
 */
function resolver_destacado(string $tipo, int $id): ?array
{
    switch ($tipo) {
        case 'semillero':
            $s = fila('SELECT * FROM semilleros WHERE id = ?', [$id]);
            return $s ? [
                'publico' => (bool) (int) $s['activo'], 'etiqueta' => 'Semillero', 'titulo' => $s['nombre'],
                'descripcion' => $s['descripcion'], 'imagen' => url_archivo($s['imagen_id'] ? (int) $s['imagen_id'] : null),
                'enlace' => 'semilleros/' . $s['slug'], 'externo' => false,
            ] : null;
        case 'proyecto':
            $p = fila('SELECT p.*, s.slug AS semillero_slug, s.nombre AS semillero_nombre, s.activo AS semillero_activo FROM proyectos p JOIN semilleros s ON s.id = p.semillero_id WHERE p.id = ?', [$id]);
            return $p ? [
                'publico' => $p['revision'] === 'aprobado' && (int) $p['semillero_activo'], 'etiqueta' => 'Proyecto · ' . $p['semillero_nombre'],
                'titulo' => $p['titulo'], 'descripcion' => $p['resumen'], 'imagen' => url_archivo($p['imagen_id'] ? (int) $p['imagen_id'] : null),
                'enlace' => 'semilleros/' . $p['semillero_slug'], 'externo' => false,
            ] : null;
        case 'documento':
            $d = fila(SQL_DOCUMENTOS . ' WHERE d.id = ?', [$id]);
            return $d ? [
                'publico' => $d['revision'] === 'aprobado', 'etiqueta' => 'Documento PDF', 'titulo' => $d['titulo'],
                'descripcion' => $d['descripcion'] ?: $d['padre_nombre'], 'imagen' => null,
                'enlace' => url_archivo((int) $d['archivo_id']), 'externo' => true,
            ] : null;
        case 'edicion':
            $e = fila('SELECT * FROM ediciones_sensaciones WHERE id = ?', [$id]);
            return $e ? [
                'publico' => (bool) (int) $e['publicada'], 'etiqueta' => 'Sensaciones', 'titulo' => $e['titulo'],
                'descripcion' => $e['descripcion'], 'imagen' => url_archivo($e['portada_id'] ? (int) $e['portada_id'] : null) ?? $e['portada_ruta_publica'],
                'enlace' => 'sensaciones', 'externo' => false,
            ] : null;
    }
    return null;
}

/** Interruptor "Destacado en inicio" desde cada listado del panel. */
function ruta_destacados_alternar(): never
{
    requerir_admin();
    $d = entrada();
    $tipo = opcion($d, 'tipo', 'El tipo', TIPOS_DESTACADO);
    $id = entero($d, 'elemento_id', 'El elemento', true, 1);
    $activo = booleano($d, 'activo', true);
    if (!resolver_destacado($tipo, $id)) {
        error_api('El elemento no existe.', 404);
    }
    if ($activo) {
        $orden = (int) valor('SELECT COALESCE(MAX(orden), 0) + 1 FROM destacados');
        q('INSERT INTO destacados (tipo, elemento_id, orden, activo) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE activo = 1', [$tipo, $id, $orden]);
    } else {
        quitar_destacado($tipo, $id);
    }
    responder(['ok' => true, 'destacado' => $activo]);
}

function ruta_destacados_listar_admin(): never
{
    requerir_admin();
    $hoy = date('Y-m-d');
    $lista = [];
    foreach (filas('SELECT * FROM destacados ORDER BY orden, id') as $f) {
        $r = resolver_destacado($f['tipo'], (int) $f['elemento_id']);
        if (!$r) {
            continue;
        }
        $vencido = $f['fin'] !== null && $f['fin'] < $hoy;
        $lista[] = [
            'id' => (int) $f['id'], 'tipo' => $f['tipo'], 'elementoId' => (int) $f['elemento_id'],
            'orden' => (int) $f['orden'], 'fin' => $f['fin'], 'activo' => (bool) (int) $f['activo'],
            'titulo' => $r['titulo'], 'etiqueta' => $r['etiqueta'], 'imagen' => $r['imagen'],
            // Por qué no se ve en el inicio (si es el caso)
            'motivo' => !$r['publico'] ? 'No está publicado' : ($vencido ? 'Su fecha de fin ya pasó' : (!(int) $f['activo'] ? 'Pausado' : null)),
        ];
    }
    responder(['destacados' => $lista]);
}

function ruta_destacados_editar(int $id): never
{
    requerir_admin();
    fila('SELECT id FROM destacados WHERE id = ?', [$id]) ?? error_api('El destacado no existe.', 404);
    $d = entrada();
    $orden = entero($d, 'orden', 'El orden', true, 0, 100000);
    $fin = fecha($d, 'fin', 'La fecha de fin');
    $activo = booleano($d, 'activo', true);
    q('UPDATE destacados SET orden = ?, fin = ?, activo = ? WHERE id = ?', [$orden, $fin, (int) $activo, $id]);
    responder(['ok' => true]);
}

/** Reordenar: recibe los ids en el orden deseado. */
function ruta_destacados_ordenar(): never
{
    requerir_admin();
    $ids = lista_ids(entrada(), 'ids');
    transaccion(function () use ($ids) {
        foreach ($ids as $i => $id) {
            q('UPDATE destacados SET orden = ? WHERE id = ?', [$i + 1, $id]);
        }
    });
    responder(['ok' => true]);
}

function ruta_destacados_eliminar(int $id): never
{
    requerir_admin();
    q('DELETE FROM destacados WHERE id = ?', [$id]);
    responder(['ok' => true]);
}

/** Lo que muestra el inicio: activos, sin vencer y con el elemento publicado. */
function ruta_publico_destacados(): never
{
    $filas = filas('SELECT * FROM destacados WHERE activo = 1 AND (fin IS NULL OR fin >= CURDATE()) ORDER BY orden, id');
    $lista = [];
    foreach ($filas as $f) {
        $r = resolver_destacado($f['tipo'], (int) $f['elemento_id']);
        if ($r && $r['publico']) {
            unset($r['publico']);
            $lista[] = ['tipo' => $f['tipo'], 'id' => (int) $f['id']] + $r;
        }
    }
    header('Cache-Control: public, max-age=60');
    responder(['destacados' => $lista]);
}
