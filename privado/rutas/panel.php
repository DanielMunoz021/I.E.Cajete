<?php
// Contadores del dashboard.
declare(strict_types=1);

function ruta_panel_resumen(): never
{
    $u = requerir_login();

    if ($u['rol'] === 'admin') {
        $pendientes = (int) valor("SELECT (SELECT COUNT(*) FROM proyectos WHERE revision = 'pendiente') + (SELECT COUNT(*) FROM documentos WHERE revision = 'pendiente')");
        responder(['resumen' => [
            'usuarios'   => (int) valor('SELECT COUNT(*) FROM usuarios WHERE activo = 1'),
            'semilleros' => (int) valor('SELECT COUNT(*) FROM semilleros'),
            'proyectos'  => (int) valor("SELECT COUNT(*) FROM proyectos WHERE revision = 'aprobado'"),
            'documentos' => (int) valor("SELECT COUNT(*) FROM documentos WHERE revision = 'aprobado'"),
            'ediciones'  => (int) valor('SELECT COUNT(*) FROM ediciones_sensaciones'),
            'pendientes' => $pendientes,
        ]]);
    }

    // Docente: solo lo suyo.
    $id = (int) $u['id'];
    responder(['resumen' => [
        'semilleros' => (int) valor('SELECT COUNT(*) FROM semillero_docentes WHERE usuario_id = ?', [$id]),
        'pendientes' => (int) valor("SELECT (SELECT COUNT(*) FROM proyectos WHERE enviado_por = ? AND revision = 'pendiente') + (SELECT COUNT(*) FROM documentos WHERE enviado_por = ? AND revision = 'pendiente')", [$id, $id]),
        'aprobados'  => (int) valor("SELECT (SELECT COUNT(*) FROM proyectos WHERE enviado_por = ? AND revision = 'aprobado') + (SELECT COUNT(*) FROM documentos WHERE enviado_por = ? AND revision = 'aprobado')", [$id, $id]),
        'rechazados' => (int) valor("SELECT (SELECT COUNT(*) FROM proyectos WHERE enviado_por = ? AND revision = 'rechazado') + (SELECT COUNT(*) FROM documentos WHERE enviado_por = ? AND revision = 'rechazado')", [$id, $id]),
    ]]);
}
