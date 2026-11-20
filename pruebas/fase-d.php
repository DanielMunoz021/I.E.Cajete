<?php
// =====================================================================
// Prueba de la fase (d): destacados en la página de inicio.
// ¡BORRA los datos de la base LOCAL!   php pruebas/fase-d.php --borrar-datos-locales
// =====================================================================
declare(strict_types=1);

require __DIR__ . '/comun.php';

preparar_base_vacia($argv);
pdo_local()->exec((string) file_get_contents(__DIR__ . '/../database/datos-iniciales.sql'));
$f = archivos_de_prueba();
crear_usuario('Admin', 'admin@pruebas.local', 'ClaveAdmin2026', 'admin');
$idAna = crear_usuario('Ana Docente', 'ana@pruebas.local', 'ClaveAna2026', 'docente');
$admin = cliente_con_sesion('admin@pruebas.local', 'ClaveAdmin2026');
$ana = cliente_con_sesion('ana@pruebas.local', 'ClaveAna2026');
$anonimo = new Cliente();

// Contenido de base
$s = $admin->subir('/semilleros', ['nombre' => 'Astronomía', 'descripcion' => 'Miramos el cielo de Cajete.', 'docentes' => (string) $idAna], ['imagen' => $f['png']])['json']['semillero'];
$p = $admin->subir('/proyectos', ['semillero_id' => $s['id'], 'titulo' => 'Telescopio casero'], [])['json']['proyecto'];
$d = $admin->subir('/documentos', ['proyecto_id' => $p['id'], 'titulo' => 'Manual del telescopio'], ['pdf' => $f['pdf']])['json']['documento'];
$idE3 = (int) pdo_local()->query('SELECT id FROM ediciones_sensaciones WHERE numero = 3')->fetchColumn();

titulo('Interruptor "Destacado en inicio"');
$r = $anonimo->get('/publico/destacados');
ok($r['estado'] === 200 && $r['json']['destacados'] === [], 'Sin destacados, el inicio no muestra la sección');
foreach ([['edicion', $idE3], ['semillero', $s['id']], ['proyecto', $p['id']], ['documento', $d['id']]] as [$tipo, $id]) {
    $r = $admin->post('/destacados', ['tipo' => $tipo, 'elemento_id' => $id, 'activo' => true]);
    ok($r['estado'] === 200, "Marca como destacado: $tipo");
}
$r = $admin->post('/destacados', ['tipo' => 'semillero', 'elemento_id' => $s['id'], 'activo' => true]);
ok($r['estado'] === 200 && (int) pdo_local()->query('SELECT COUNT(*) FROM destacados')->fetchColumn() === 4, 'Activarlo dos veces no lo duplica');
$r = $admin->post('/destacados', ['tipo' => 'proyecto', 'elemento_id' => 99999, 'activo' => true]);
ok($r['estado'] === 404, 'No permite destacar algo que no existe');
$r = $admin->get('/admin/semilleros');
ok($r['json']['semilleros'][0]['destacado'] === true, 'El listado del panel refleja el interruptor');

titulo('Inicio público');
$r = $anonimo->get('/publico/destacados');
$tipos = array_column($r['json']['destacados'], 'tipo');
ok($tipos === ['edicion', 'semillero', 'proyecto', 'documento'], 'Muestra los 4 tipos en el orden en que se marcaron');
$doc = $r['json']['destacados'][3];
ok($doc['externo'] === true && str_starts_with($doc['enlace'], 'api/archivo/'), 'El PDF destacado enlaza a su archivo');
ok($r['json']['destacados'][1]['enlace'] === 'semilleros/astronomia', 'El semillero destacado enlaza a su página');

titulo('Orden y fecha de fin');
$admin_d = $admin->get('/admin/destacados')['json']['destacados'];
$ids = array_column($admin_d, 'id');
$r = $admin->post('/destacados/orden', ['ids' => array_reverse($ids)]);
$tipos = array_column($anonimo->get('/publico/destacados')['json']['destacados'], 'tipo');
ok($r['estado'] === 200 && $tipos === ['documento', 'proyecto', 'semillero', 'edicion'], 'Reordenar cambia el orden del inicio');
$idDoc = $admin_d[3]['id'];
$r = $admin->put("/destacados/$idDoc", ['orden' => 1, 'fin' => date('Y-m-d', strtotime('-1 day')), 'activo' => true]);
$lista = $anonimo->get('/publico/destacados')['json']['destacados'];
ok($r['estado'] === 200 && !in_array('documento', array_column($lista, 'tipo'), true), 'Con la fecha de fin vencida deja de mostrarse');
$motivo = array_values(array_filter($admin->get('/admin/destacados')['json']['destacados'], fn ($x) => $x['id'] === $idDoc))[0]['motivo'];
ok($motivo === 'Su fecha de fin ya pasó', 'El panel explica por qué no se ve');
$r = $admin->put("/destacados/$idDoc", ['orden' => 1, 'fin' => date('Y-m-d'), 'activo' => true]);
ok(in_array('documento', array_column($anonimo->get('/publico/destacados')['json']['destacados'], 'tipo'), true), 'Se sigue mostrando el mismo día de la fecha de fin');
$r = $admin->put("/destacados/$idDoc", ['orden' => 1, 'fin' => '', 'activo' => false]);
ok(!in_array('documento', array_column($anonimo->get('/publico/destacados')['json']['destacados'], 'tipo'), true), 'Pausado: no se muestra');

titulo('Solo se muestra lo publicado');
$admin->subir("/semilleros/{$s['id']}", ['nombre' => 'Astronomía', 'activo' => '0', 'docentes' => (string) $idAna], []);
$tipos = array_column($anonimo->get('/publico/destacados')['json']['destacados'], 'tipo');
ok(!in_array('semillero', $tipos, true) && !in_array('proyecto', $tipos, true), 'Si el semillero se desactiva, ni él ni sus proyectos salen en el inicio');
$admin->subir("/semilleros/{$s['id']}", ['nombre' => 'Astronomía', 'activo' => '1', 'docentes' => (string) $idAna], []);

titulo('Permisos y limpieza');
$r = $ana->post('/destacados', ['tipo' => 'semillero', 'elemento_id' => $s['id'], 'activo' => true]);
ok($r['estado'] === 403, 'Un docente no puede destacar contenido');
$r = $ana->get('/admin/destacados');
ok($r['estado'] === 403, 'Un docente no ve la gestión de destacados');
$admin->delete("/semilleros/{$s['id']}");
$quedan = array_column($admin->get('/admin/destacados')['json']['destacados'], 'tipo');
ok($quedan === ['edicion'], 'Al borrar el semillero se quitan sus destacados (y los de sus proyectos y PDFs)');
ok((int) pdo_local()->query("SELECT COUNT(*) FROM destacados WHERE tipo <> 'edicion'")->fetchColumn() === 0, 'No quedan destacados huérfanos en la base');

resumen_final();
