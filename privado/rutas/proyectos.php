<?php
// Proyectos de los semilleros. Admin: todos. Docente: propone en sus semilleros (queda pendiente).
declare(strict_types=1);

function ruta_proyectos_listar_admin(): never
{
    requerir_admin();
    $filas = filas(SQL_PROYECTOS . " ORDER BY FIELD(p.revision, 'pendiente', 'aprobado', 'rechazado'), p.creado_en DESC");
    responder(['proyectos' => array_map(fn ($p) => proyecto_json($p, true), $filas)]);
}

function datos_proyecto(): array
{
    $d = entrada();
    return [
        'semillero_id' => entero($d, 'semillero_id', 'El semillero', true, 1),
        'titulo'       => texto($d, 'titulo', 'El título', 200),
        'resumen'      => texto($d, 'resumen', 'El resumen', 5000, false),
        'integrantes'  => texto($d, 'integrantes', 'Los integrantes', 3000, false),
        'anio'         => entero($d, 'anio', 'El año', false, 1990, 2100),
        'estado'       => opcion($d + ['estado' => 'en_curso'], 'estado', 'El estado', ['en_curso', 'finalizado']),
        'quitar_imagen' => booleano($d, 'quitar_imagen'),
    ];
}

function ruta_proyectos_crear(): never
{
    $u = requerir_login();
    verificar_tamano_peticion();
    $d = datos_proyecto();
    exigir_semillero_permitido($u, $d['semillero_id']);
    $imagenId = hay_archivo('imagen') ? guardar_subida('imagen', 'imagen', (int) $u['id']) : null;
    $r = revision_inicial($u);

    q(
        'INSERT INTO proyectos (semillero_id, titulo, slug, resumen, integrantes, anio, imagen_id, estado, revision, enviado_por, revisado_por, revisado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [$d['semillero_id'], $d['titulo'], slug_unico('proyectos', $d['titulo']), $d['resumen'], $d['integrantes'], $d['anio'], $imagenId,
         $d['estado'], $r['revision'], (int) $u['id'], $r['revisado_por'], $r['revisado_en']]
    );
    responder(['proyecto' => proyecto_json(fila(SQL_PROYECTOS . ' WHERE p.id = ?', [ultimo_id()]), true)], 201);
}

function ruta_proyectos_editar(int $id): never
{
    $u = requerir_login();
    verificar_tamano_peticion();
    $actual = fila('SELECT * FROM proyectos WHERE id = ?', [$id]) ?? error_api('El proyecto no existe.', 404);
    exigir_puede_modificar($u, $actual);
    $d = datos_proyecto();
    exigir_semillero_permitido($u, $d['semillero_id']);

    $imagenAnterior = $actual['imagen_id'] ? (int) $actual['imagen_id'] : null;
    $imagenId = $imagenAnterior;
    if (hay_archivo('imagen')) {
        $imagenId = guardar_subida('imagen', 'imagen', (int) $u['id']);
    } elseif ($d['quitar_imagen']) {
        $imagenId = null;
    }
    // Si un docente corrige un envío rechazado, vuelve a revisión.
    $revision = $u['rol'] === 'admin' ? $actual['revision'] : 'pendiente';
    $slug = $d['titulo'] === $actual['titulo'] ? $actual['slug'] : slug_unico('proyectos', $d['titulo'], $id);

    q(
        'UPDATE proyectos SET semillero_id = ?, titulo = ?, slug = ?, resumen = ?, integrantes = ?, anio = ?, imagen_id = ?, estado = ?, revision = ?
         WHERE id = ?',
        [$d['semillero_id'], $d['titulo'], $slug, $d['resumen'], $d['integrantes'], $d['anio'], $imagenId, $d['estado'], $revision, $id]
    );
    if ($imagenAnterior !== $imagenId) {
        borrar_archivo($imagenAnterior);
    }
    responder(['proyecto' => proyecto_json(fila(SQL_PROYECTOS . ' WHERE p.id = ?', [$id]), true)]);
}

function ruta_proyectos_eliminar(int $id): never
{
    $u = requerir_login();
    $p = fila('SELECT * FROM proyectos WHERE id = ?', [$id]) ?? error_api('El proyecto no existe.', 404);
    exigir_puede_modificar($u, $p);
    $docs = filas('SELECT id, archivo_id FROM documentos WHERE proyecto_id = ?', [$id]);

    transaccion(function () use ($id, $docs) {
        quitar_destacado('proyecto', $id);
        foreach ($docs as $doc) {
            quitar_destacado('documento', (int) $doc['id']);
        }
        q('DELETE FROM proyectos WHERE id = ?', [$id]); // sus documentos caen en cascada
    });
    borrar_archivo($p['imagen_id'] ? (int) $p['imagen_id'] : null);
    foreach ($docs as $doc) {
        borrar_archivo((int) $doc['archivo_id']);
    }
    responder(['ok' => true]);
}
