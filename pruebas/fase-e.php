<?php
// =====================================================================
// Prueba de la fase (e): envíos de docentes, pendientes y aprobación.
// ¡BORRA los datos de la base LOCAL!   php pruebas/fase-e.php --borrar-datos-locales
// =====================================================================
declare(strict_types=1);

require __DIR__ . '/comun.php';

preparar_base_vacia($argv);
$f = archivos_de_prueba();
crear_usuario('Admin', 'admin@pruebas.local', 'ClaveAdmin2026', 'admin');
$idAna = crear_usuario('Ana Docente', 'ana@pruebas.local', 'ClaveAna2026', 'docente');
crear_usuario('Beto Docente', 'beto@pruebas.local', 'ClaveBeto2026', 'docente');
$admin = cliente_con_sesion('admin@pruebas.local', 'ClaveAdmin2026');
$ana = cliente_con_sesion('ana@pruebas.local', 'ClaveAna2026');
$beto = cliente_con_sesion('beto@pruebas.local', 'ClaveBeto2026');
$anonimo = new Cliente();

$s = $admin->subir('/semilleros', ['nombre' => 'Biología', 'docentes' => (string) $idAna], [])['json']['semillero'];
$aprobado = $admin->subir('/proyectos', ['semillero_id' => $s['id'], 'titulo' => 'Mariposas de Cajete'], [])['json']['proyecto'];

titulo('Vista del docente');
$r = $ana->get('/mis/semilleros');
ok($r['estado'] === 200 && count($r['json']['semilleros']) === 1 && $r['json']['semilleros'][0]['proyectos'][0]['titulo'] === 'Mariposas de Cajete', 'La docente ve su semillero y los proyectos donde puede subir PDFs');
$r = $beto->get('/mis/semilleros');
ok($r['estado'] === 200 && $r['json']['semilleros'] === [], 'Un docente sin asignación no ve semilleros');

titulo('Envíos y bandeja de pendientes');
$prop = $ana->subir('/proyectos', ['semillero_id' => $s['id'], 'titulo' => 'Huerta escolar'], [])['json']['proyecto'];
$docProp = $ana->subir('/documentos', ['proyecto_id' => $prop['id'], 'titulo' => 'Plan de la huerta'], ['pdf' => $f['pdf']])['json']['documento'];
$docOk = $ana->subir('/documentos', ['proyecto_id' => $aprobado['id'], 'titulo' => 'Conteo de especies'], ['pdf' => $f['pdf']])['json']['documento'];
$r = $admin->get('/pendientes');
ok($r['estado'] === 200 && count($r['json']['proyectos']) === 1 && count($r['json']['documentos']) === 2, 'El admin ve 1 proyecto y 2 PDFs pendientes');
$r = $admin->get('/panel/resumen');
ok($r['json']['resumen']['pendientes'] === 3, 'El dashboard cuenta 3 pendientes');
$r = $ana->get('/panel/resumen');
ok($r['json']['resumen']['pendientes'] === 3 && $r['json']['resumen']['semilleros'] === 1, 'El dashboard de la docente cuenta sus envíos');
$r = $ana->get('/pendientes');
ok($r['estado'] === 403, 'Un docente no puede ver la bandeja del admin');

titulo('Aprobar');
$r = $admin->post("/revision/documento/{$docProp['id']}/aprobar");
ok($r['estado'] === 422, 'No aprueba un PDF cuyo proyecto aún está pendiente');
$r = $admin->post("/revision/proyecto/{$prop['id']}/aprobar");
ok($r['estado'] === 200, 'Aprueba el proyecto');
$r = $admin->post("/revision/documento/{$docProp['id']}/aprobar");
ok($r['estado'] === 200, 'Ahora sí aprueba su PDF');
$r = $anonimo->get('/publico/semilleros/biologia');
$titulos = array_column($r['json']['proyectos'], 'titulo');
ok(in_array('Huerta escolar', $titulos, true) && count($r['json']['proyectos'][array_search('Huerta escolar', $titulos)]['documentos']) === 1, 'Lo aprobado aparece en la página pública con su PDF');
ok(str_starts_with($anonimo->crudo('GET', '/' . $docProp['url']), '%PDF-'), 'El PDF aprobado ya se descarga sin sesión');

titulo('Rechazar con comentario');
$r = $admin->post("/revision/documento/{$docOk['id']}/rechazar", ['comentario' => '']);
ok($r['estado'] === 422, 'Rechazar exige un comentario para el docente');
$r = $admin->post("/revision/documento/{$docOk['id']}/rechazar", ['comentario' => 'Falta la bibliografía.']);
ok($r['estado'] === 200, 'Rechaza el PDF con comentario');
$r = $ana->get('/mis/envios');
$doc = array_values(array_filter($r['json']['documentos'], fn ($d) => $d['id'] === $docOk['id']))[0];
ok($doc['revision'] === 'rechazado' && $doc['comentarioRevision'] === 'Falta la bibliografía.', 'La docente ve el rechazo y el comentario');
ok(str_contains($anonimo->crudo('GET', '/' . $doc['url']), 'no existe'), 'Un PDF rechazado no es público');

titulo('Corregir y reenviar');
$r = $ana->subir("/documentos/{$docOk['id']}", ['proyecto_id' => $aprobado['id'], 'titulo' => 'Conteo de especies (con bibliografía)'], ['pdf' => $f['pdf']]);
ok($r['estado'] === 200 && $r['json']['documento']['revision'] === 'pendiente', 'Al corregir un envío rechazado vuelve a quedar pendiente');
$r = $admin->get('/pendientes');
ok(count($r['json']['documentos']) === 1, 'Vuelve a la bandeja del admin');
$r = $ana->delete("/documentos/{$docProp['id']}");
ok($r['estado'] === 403, 'Ya aprobado, la docente no puede borrarlo');
$r = $beto->post("/revision/proyecto/{$prop['id']}/rechazar", ['comentario' => 'x']);
ok($r['estado'] === 403, 'Un docente no puede aprobar ni rechazar');

titulo('Un contenido rechazado no queda destacado');
$admin->post('/destacados', ['tipo' => 'proyecto', 'elemento_id' => $prop['id'], 'activo' => true]);
$admin->post("/revision/proyecto/{$prop['id']}/rechazar", ['comentario' => 'Se retira por revisión.']);
ok((int) pdo_local()->query("SELECT COUNT(*) FROM destacados WHERE tipo = 'proyecto'")->fetchColumn() === 0, 'Al rechazarlo se quita de los destacados');

resumen_final();
