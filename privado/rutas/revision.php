<?php
// Aprobación del contenido que envían los docentes, y vistas del docente.
declare(strict_types=1);

// ---------------------------------------------------------------------
// Admin: bandeja de pendientes
// ---------------------------------------------------------------------
function ruta_pendientes(): never
{
    requerir_admin();
    $proyectos = filas(SQL_PROYECTOS . " WHERE p.revision = 'pendiente' ORDER BY p.actualizado_en");
    $documentos = filas(SQL_DOCUMENTOS . " WHERE d.revision = 'pendiente' ORDER BY d.actualizado_en");
    responder([
        'proyectos'  => array_map(fn ($p) => proyecto_json($p, true), $proyectos),
        'documentos' => array_map(function ($d) {
            $j = documento_json($d, true);
            // Si el PDF es de un proyecto que aún no está aprobado, hay que aprobar primero el proyecto
            $j['proyectoPendiente'] = $d['proyecto_id'] !== null
                && valor('SELECT revision FROM proyectos WHERE id = ?', [$d['proyecto_id']]) !== 'aprobado';
            return $j;
        }, $documentos),
    ]);
}

function tabla_revision(string $tipo): string
{
    return $tipo === 'proyecto' ? 'proyectos' : 'documentos';
}

function ruta_revision_aprobar(string $tipo, int $id): never
{
    $admin = requerir_admin();
    $tabla = tabla_revision($tipo);
    $fila = fila("SELECT * FROM $tabla WHERE id = ?", [$id]) ?? error_api('El envío no existe.', 404);
    if ($tipo === 'documento' && $fila['proyecto_id'] !== null
        && valor('SELECT revision FROM proyectos WHERE id = ?', [$fila['proyecto_id']]) !== 'aprobado') {
        error_api('Este PDF pertenece a un proyecto que aún no está aprobado. Aprueba primero el proyecto.', 422);
    }
    q("UPDATE $tabla SET revision = 'aprobado', comentario_revision = NULL, revisado_por = ?, revisado_en = NOW() WHERE id = ?", [$admin['id'], $id]);
    responder(['ok' => true]);
}

function ruta_revision_rechazar(string $tipo, int $id): never
{
    $admin = requerir_admin();
    $tabla = tabla_revision($tipo);
    fila("SELECT id FROM $tabla WHERE id = ?", [$id]) ?? error_api('El envío no existe.', 404);
    $comentario = texto(entrada(), 'comentario', 'El comentario para el docente', 2000);
    transaccion(function () use ($tabla, $tipo, $id, $comentario, $admin) {
        q("UPDATE $tabla SET revision = 'rechazado', comentario_revision = ?, revisado_por = ?, revisado_en = NOW() WHERE id = ?", [$comentario, $admin['id'], $id]);
        quitar_destacado($tipo, $id); // un contenido rechazado no puede seguir destacado
    });
    responder(['ok' => true]);
}

// ---------------------------------------------------------------------
// Docente: sus semilleros y sus envíos
// ---------------------------------------------------------------------
function ruta_mis_semilleros(): never
{
    $u = requerir_login();
    $ids = $u['rol'] === 'admin'
        ? array_map('intval', array_column(filas('SELECT id FROM semilleros'), 'id'))
        : semilleros_asignados((int) $u['id']);
    $lista = [];
    foreach ($ids as $id) {
        $s = fila('SELECT s.*, u.nombre AS lider_nombre FROM semilleros s LEFT JOIN usuarios u ON u.id = s.lider_id WHERE s.id = ?', [$id]);
        if (!$s) {
            continue;
        }
        $j = semillero_json($s);
        // Proyectos a los que puede adjuntar PDFs: los aprobados y sus propias propuestas
        $j['proyectos'] = array_map(
            fn ($p) => ['id' => (int) $p['id'], 'titulo' => $p['titulo'], 'revision' => $p['revision'], 'semilleroId' => (int) $p['semillero_id']],
            filas("SELECT id, titulo, revision, semillero_id FROM proyectos WHERE semillero_id = ? AND (revision = 'aprobado' OR enviado_por = ?) ORDER BY titulo", [$id, $u['id']])
        );
        $lista[] = $j;
    }
    responder(['semilleros' => $lista]);
}

function ruta_mis_envios(): never
{
    $u = requerir_login();
    $id = (int) $u['id'];
    responder([
        'proyectos'  => array_map(fn ($p) => proyecto_json($p, true), filas(SQL_PROYECTOS . ' WHERE p.enviado_por = ? ORDER BY p.actualizado_en DESC', [$id])),
        'documentos' => array_map(fn ($d) => documento_json($d, true), filas(SQL_DOCUMENTOS . ' WHERE d.enviado_por = ? ORDER BY d.actualizado_en DESC', [$id])),
    ]);
}
