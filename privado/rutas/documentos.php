<?php
// Documentos PDF (informes, artículos, pósters) de un semillero o de un proyecto.
declare(strict_types=1);

function ruta_documentos_listar_admin(): never
{
    requerir_admin();
    $filas = filas(SQL_DOCUMENTOS . " ORDER BY FIELD(d.revision, 'pendiente', 'aprobado', 'rechazado'), d.creado_en DESC");
    responder(['documentos' => array_map(fn ($d) => documento_json($d, true), $filas)]);
}

/** Valida a qué pertenece el documento y que el usuario pueda publicar allí. */
function padre_documento(array $u, array $d): array
{
    $semilleroId = entero($d, 'semillero_id', 'El semillero', false, 1);
    $proyectoId = entero($d, 'proyecto_id', 'El proyecto', false, 1);
    if (($semilleroId === null) === ($proyectoId === null)) {
        invalido('proyecto_id', 'Elige si el PDF pertenece a un semillero o a uno de sus proyectos.');
    }
    if ($proyectoId !== null) {
        $p = fila('SELECT semillero_id, revision, enviado_por FROM proyectos WHERE id = ?', [$proyectoId]) ?? invalido('proyecto_id', 'El proyecto no existe.');
        exigir_semillero_permitido($u, (int) $p['semillero_id']);
        // Un docente puede adjuntar a proyectos aprobados o a sus propias propuestas
        if ($u['rol'] !== 'admin' && $p['revision'] !== 'aprobado' && (int) $p['enviado_por'] !== (int) $u['id']) {
            error_api('Ese proyecto todavía no está aprobado.', 403);
        }
    } else {
        exigir_semillero_permitido($u, $semilleroId);
    }
    return [$semilleroId, $proyectoId];
}

function ruta_documentos_crear(): never
{
    $u = requerir_login();
    verificar_tamano_peticion();
    $d = entrada();
    [$semilleroId, $proyectoId] = padre_documento($u, $d);
    $titulo = texto($d, 'titulo', 'El título', 200);
    $descripcion = texto($d, 'descripcion', 'La descripción', 3000, false);
    $fecha = fecha($d, 'fecha', 'La fecha') ?? date('Y-m-d');
    $archivoId = guardar_subida('pdf', 'pdf', (int) $u['id']);
    $r = revision_inicial($u);

    q(
        'INSERT INTO documentos (archivo_id, titulo, descripcion, fecha, semillero_id, proyecto_id, revision, enviado_por, revisado_por, revisado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [$archivoId, $titulo, $descripcion, $fecha, $semilleroId, $proyectoId, $r['revision'], (int) $u['id'], $r['revisado_por'], $r['revisado_en']]
    );
    responder(['documento' => documento_json(fila(SQL_DOCUMENTOS . ' WHERE d.id = ?', [ultimo_id()]), true)], 201);
}

function ruta_documentos_editar(int $id): never
{
    $u = requerir_login();
    verificar_tamano_peticion();
    $actual = fila('SELECT * FROM documentos WHERE id = ?', [$id]) ?? error_api('El documento no existe.', 404);
    exigir_puede_modificar($u, $actual);
    $d = entrada();
    [$semilleroId, $proyectoId] = padre_documento($u, $d);
    $titulo = texto($d, 'titulo', 'El título', 200);
    $descripcion = texto($d, 'descripcion', 'La descripción', 3000, false);
    $fecha = fecha($d, 'fecha', 'La fecha') ?? $actual['fecha'];

    $archivoAnterior = (int) $actual['archivo_id'];
    $archivoId = hay_archivo('pdf') ? guardar_subida('pdf', 'pdf', (int) $u['id']) : $archivoAnterior;
    $revision = $u['rol'] === 'admin' ? $actual['revision'] : 'pendiente';

    q(
        'UPDATE documentos SET archivo_id = ?, titulo = ?, descripcion = ?, fecha = ?, semillero_id = ?, proyecto_id = ?, revision = ? WHERE id = ?',
        [$archivoId, $titulo, $descripcion, $fecha, $semilleroId, $proyectoId, $revision, $id]
    );
    if ($archivoId !== $archivoAnterior) {
        borrar_archivo($archivoAnterior);
    }
    responder(['documento' => documento_json(fila(SQL_DOCUMENTOS . ' WHERE d.id = ?', [$id]), true)]);
}

function ruta_documentos_eliminar(int $id): never
{
    $u = requerir_login();
    $doc = fila('SELECT * FROM documentos WHERE id = ?', [$id]) ?? error_api('El documento no existe.', 404);
    exigir_puede_modificar($u, $doc);
    transaccion(function () use ($id) {
        quitar_destacado('documento', $id);
        q('DELETE FROM documentos WHERE id = ?', [$id]);
    });
    borrar_archivo((int) $doc['archivo_id']);
    responder(['ok' => true]);
}
