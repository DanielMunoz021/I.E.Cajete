<?php
// =====================================================================
// Prueba de la fase (c): ediciones de Sensaciones.
// ¡BORRA los datos de la base LOCAL!   php pruebas/fase-c.php --borrar-datos-locales
// =====================================================================
declare(strict_types=1);

require __DIR__ . '/comun.php';

preparar_base_vacia($argv);
pdo_local()->exec((string) file_get_contents(__DIR__ . '/../database/datos-iniciales.sql'));
$f = archivos_de_prueba();
crear_usuario('Admin', 'admin@pruebas.local', 'ClaveAdmin2026', 'admin');
crear_usuario('Ana Docente', 'ana@pruebas.local', 'ClaveAna2026', 'docente');
$admin = cliente_con_sesion('admin@pruebas.local', 'ClaveAdmin2026');
$ana = cliente_con_sesion('ana@pruebas.local', 'ClaveAna2026');
$anonimo = new Cliente();

titulo('Ediciones existentes (datos iniciales)');
$r = $anonimo->get('/publico/ediciones');
$nums = array_column($r['json']['ediciones'], 'numero');
ok($r['estado'] === 200 && $nums === [3, 1], 'Muestra las 2 ediciones del sitio, de la más reciente a la más antigua');
ok($r['json']['ediciones'][0]['pdf'] === 'docs/sensaciones-3-2025.pdf' && $r['json']['ediciones'][0]['portada'] === 'img/sensaciones-3-2025.jpg', 'Las ediciones históricas usan los archivos que ya están en el sitio');

titulo('Gestión (admin)');
$r = $admin->subir('/ediciones', ['numero' => '2', 'titulo' => 'Segunda edición', 'fecha' => '2024-05-01', 'descripcion' => 'Edición de mitad de año.', 'publicada' => '1'], ['pdf' => $f['pdf'], 'portada' => $f['png']]);
ok($r['estado'] === 201 && str_starts_with((string) $r['json']['edicion']['pdf'], 'api/archivo/'), 'Crea una edición con PDF y portada');
$idE2 = $r['json']['edicion']['id'];
$r = $anonimo->get('/publico/ediciones');
ok(array_column($r['json']['ediciones'], 'numero') === [3, 2, 1], 'Queda ordenada por fecha en la cuadrícula pública');
$r = $admin->subir('/ediciones', ['numero' => '2', 'titulo' => 'Repetida', 'fecha' => '2024-06-01'], ['pdf' => $f['pdf']]);
ok($r['estado'] === 422 && $r['json']['campo'] === 'numero', 'No permite números de edición repetidos');
$r = $admin->subir('/ediciones', ['numero' => '9', 'titulo' => 'Sin PDF', 'fecha' => '2024-06-01'], []);
ok($r['estado'] === 422 && $r['json']['campo'] === 'pdf', 'El PDF de la revista es obligatorio');
$r = $admin->subir('/ediciones', ['numero' => '9', 'titulo' => 'Fecha mala', 'fecha' => '2024-13-45'], ['pdf' => $f['pdf']]);
ok($r['estado'] === 422 && $r['json']['campo'] === 'fecha', 'Valida la fecha');
$r = $admin->subir('/ediciones', ['numero' => '4', 'titulo' => 'Borrador', 'fecha' => '2026-11-01', 'publicada' => '0'], ['pdf' => $f['pdf']]);
ok($r['estado'] === 201, 'Crea una edición sin publicar (borrador)');
$urlBorrador = $r['json']['edicion']['pdf'];
$idBorrador = $r['json']['edicion']['id'];
$r = $anonimo->get('/publico/ediciones');
ok(!in_array(4, array_column($r['json']['ediciones'], 'numero'), true), 'El borrador no aparece en el sitio');
ok(str_contains($anonimo->crudo('GET', '/' . $urlBorrador), 'no existe'), 'El PDF del borrador no se puede descargar');
$r = $admin->get('/admin/ediciones');
ok(count($r['json']['ediciones']) === 4, 'El admin ve también los borradores');

titulo('Editar y borrar');
$idE3 = (int) pdo_local()->query('SELECT id FROM ediciones_sensaciones WHERE numero = 3')->fetchColumn();
$r = $admin->subir("/ediciones/$idE3", ['numero' => '3', 'titulo' => 'Tercera edición', 'fecha' => '2025-11-01', 'publicada' => '1'], ['pdf' => $f['pdf']]);
ok($r['estado'] === 200 && str_starts_with((string) $r['json']['edicion']['pdf'], 'api/archivo/') && $r['json']['edicion']['portada'] === 'img/sensaciones-3-2025.jpg', 'Reemplaza el PDF de una edición histórica y conserva su portada');
$antes = (int) pdo_local()->query('SELECT COUNT(*) FROM archivos')->fetchColumn();
$r = $admin->delete("/ediciones/$idE2");
$despues = (int) pdo_local()->query('SELECT COUNT(*) FROM archivos')->fetchColumn();
ok($r['estado'] === 200 && $antes - $despues === 2, 'Al borrar una edición se eliminan su PDF y su portada');

titulo('Permisos');
$r = $ana->subir('/ediciones', ['numero' => '7', 'titulo' => 'Intento', 'fecha' => '2026-01-01'], ['pdf' => $f['pdf']]);
ok($r['estado'] === 403, 'Un docente no puede crear ediciones');
$r = $ana->delete("/ediciones/$idBorrador");
ok($r['estado'] === 403, 'Un docente no puede borrar ediciones');
$r = $ana->get('/admin/ediciones');
ok($r['estado'] === 403, 'Un docente no ve el listado del admin');

resumen_final();
