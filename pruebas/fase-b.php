<?php
// =====================================================================
// Prueba de la fase (b): semilleros, proyectos, PDFs, archivos y permisos.
// ¡BORRA los datos de la base LOCAL!   php pruebas/fase-b.php --borrar-datos-locales
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

titulo('Semilleros (admin)');
$r = $admin->subir('/semilleros', ['nombre' => 'Robótica Rural', 'descripcion' => 'Robots con material reciclado.', 'lider_id' => $idAna, 'docentes' => (string) $idAna, 'activo' => '1'], ['imagen' => $f['png']]);
ok($r['estado'] === 201 && $r['json']['semillero']['slug'] === 'robotica-rural' && str_starts_with((string) $r['json']['semillero']['imagen'], 'api/archivo/'), 'Crea semillero con imagen, líder y docente asignado (slug sin tildes)');
$idS1 = $r['json']['semillero']['id'];
$r = $admin->subir('/semilleros', ['nombre' => 'Robótica rural', 'activo' => '1'], []);
ok($r['estado'] === 201 && $r['json']['semillero']['slug'] === 'robotica-rural-2', 'Nombre parecido: slug único (-2)');
$idS2 = $r['json']['semillero']['id'];
$r = $admin->subir('/semilleros', ['nombre' => 'Con imagen falsa'], ['imagen' => $f['ataque']]);
ok($r['estado'] === 422, 'Rechaza un .jpg que en realidad es código PHP (MIME real con finfo)');
$r = $admin->subir('/semilleros', ['nombre' => ''], []);
ok($r['estado'] === 422 && $r['json']['campo'] === 'nombre', 'El nombre es obligatorio');
$r = $admin->get('/admin/semilleros');
ok($r['estado'] === 200 && count($r['json']['semilleros']) === 2 && $r['json']['semilleros'][0]['docentes'] !== null, 'Lista de semilleros del admin');

titulo('Proyectos y documentos (admin)');
$r = $admin->subir('/proyectos', ['semillero_id' => $idS1, 'titulo' => 'Brazo robótico', 'resumen' => 'Un brazo con servos.', 'integrantes' => "Laura\nPedro", 'anio' => '2026', 'estado' => 'en_curso'], ['imagen' => $f['png']]);
ok($r['estado'] === 201 && $r['json']['proyecto']['revision'] === 'aprobado' && $r['json']['proyecto']['integrantes'] === ['Laura', 'Pedro'], 'El admin crea un proyecto: queda aprobado');
$idP1 = $r['json']['proyecto']['id'];
$r = $admin->subir('/documentos', ['proyecto_id' => $idP1, 'titulo' => 'Informe final', 'fecha' => '2026-10-01'], ['pdf' => $f['pdf']]);
ok($r['estado'] === 201 && $r['json']['documento']['revision'] === 'aprobado', 'Sube un PDF al proyecto');
$idDoc1 = $r['json']['documento']['id'];
$urlDoc1 = $r['json']['documento']['url'];
$r = $admin->subir('/documentos', ['semillero_id' => $idS1, 'titulo' => 'Póster'], ['pdf' => $f['falso']]);
ok($r['estado'] === 422 && $r['json']['campo'] === 'pdf', 'Rechaza un .pdf que no es PDF');
$r = $admin->subir('/documentos', ['semillero_id' => $idS1, 'proyecto_id' => $idP1, 'titulo' => 'Doble'], ['pdf' => $f['pdf']]);
ok($r['estado'] === 422, 'Un PDF no puede pertenecer a semillero y proyecto a la vez');
$r = $admin->subir('/documentos', ['semillero_id' => $idS1, 'titulo' => 'Sin archivo'], []);
ok($r['estado'] === 422 && $r['json']['campo'] === 'pdf', 'El PDF es obligatorio');
$r = $admin->subir('/documentos', ['semillero_id' => $idS1, 'titulo' => 'Póster del semillero', 'fecha' => '2026-09-15'], ['pdf' => $f['pdf']]);
ok($r['estado'] === 201, 'Sube un PDF directo al semillero');

titulo('Páginas públicas');
$r = $anonimo->get('/publico/semilleros');
$s1 = array_values(array_filter($r['json']['semilleros'], fn ($s) => $s['id'] === $idS1))[0] ?? null;
ok($r['estado'] === 200 && $s1 && $s1['proyectos'] === 1 && $s1['documentos'] === 2 && $s1['lider'] === 'Ana Docente', 'Listado público con contadores y líder');
ok(!isset($s1['docentes']) && !isset($s1['destacado']), 'El listado público no expone datos internos');
$r = $anonimo->get('/publico/semilleros/robotica-rural');
ok($r['estado'] === 200 && count($r['json']['proyectos']) === 1 && count($r['json']['proyectos'][0]['documentos']) === 1 && count($r['json']['documentos']) === 1, 'Detalle público: proyectos con sus PDFs y PDFs del semillero');
$r = $anonimo->crudo('GET', '/' . $urlDoc1);
ok(str_starts_with($r, '%PDF-'), 'Un PDF aprobado se descarga sin iniciar sesión');

titulo('Docente: solo en sus semilleros y queda pendiente');
$r = $ana->subir('/proyectos', ['semillero_id' => $idS1, 'titulo' => 'Huerta automática', 'anio' => '2026'], []);
ok($r['estado'] === 201 && $r['json']['proyecto']['revision'] === 'pendiente', 'La docente propone un proyecto en su semillero: queda pendiente');
$idP2 = $r['json']['proyecto']['id'];
$r = $ana->subir('/proyectos', ['semillero_id' => $idS2, 'titulo' => 'Intruso'], []);
ok($r['estado'] === 403, 'No puede proponer en un semillero que no tiene asignado');
$r = $ana->subir('/documentos', ['proyecto_id' => $idP2, 'titulo' => 'Avance'], ['pdf' => $f['pdf']]);
ok($r['estado'] === 201 && $r['json']['documento']['revision'] === 'pendiente', 'Sube un PDF a su propuesta: pendiente');
$urlPendiente = $r['json']['documento']['url'];
$r = $anonimo->get('/publico/semilleros/robotica-rural');
ok(count($r['json']['proyectos']) === 1, 'Lo pendiente NO aparece en la página pública');
$r = $anonimo->crudo('GET', '/' . $urlPendiente);
ok(str_contains($r, 'no existe'), 'El PDF pendiente no se puede descargar sin permiso');
ok(str_starts_with($ana->crudo('GET', '/' . $urlPendiente), '%PDF-'), 'Quien lo subió sí puede verlo');
ok(str_starts_with($admin->crudo('GET', '/' . $urlPendiente), '%PDF-'), 'El admin también puede verlo');
ok(str_contains($beto->crudo('GET', '/' . $urlPendiente), 'no existe'), 'Otro docente no puede verlo');
$r = $ana->subir("/proyectos/$idP2", ['semillero_id' => $idS1, 'titulo' => 'Huerta automática v2'], []);
ok($r['estado'] === 200 && $r['json']['proyecto']['titulo'] === 'Huerta automática v2', 'Puede corregir su propio envío pendiente');
$r = $ana->subir("/proyectos/$idP1", ['semillero_id' => $idS1, 'titulo' => 'Cambiado por docente'], []);
ok($r['estado'] === 403, 'No puede modificar un proyecto ya aprobado');
$r = $ana->delete("/documentos/$idDoc1");
ok($r['estado'] === 403, 'No puede borrar documentos aprobados');
$r = $ana->get('/admin/semilleros');
ok($r['estado'] === 403, 'No puede usar las rutas del admin');
$r = $beto->subir('/documentos', ['proyecto_id' => $idP2, 'titulo' => 'Ajeno'], ['pdf' => $f['pdf']]);
ok($r['estado'] === 403, 'Otro docente no puede adjuntar a un semillero ajeno');

titulo('Semillero inactivo y borrado');
$r = $admin->subir("/semilleros/$idS1", ['nombre' => 'Robótica Rural', 'activo' => '0', 'docentes' => (string) $idAna], []);
ok($r['estado'] === 200 && $r['json']['semillero']['activo'] === false, 'Desactiva el semillero');
$r = $anonimo->get('/publico/semilleros/robotica-rural');
ok($r['estado'] === 404, 'Un semillero inactivo no se muestra al público');
$archivosAntes = (int) pdo_local()->query('SELECT COUNT(*) FROM archivos')->fetchColumn();
$rutas = pdo_local()->query('SELECT ruta_interna FROM archivos')->fetchAll(PDO::FETCH_COLUMN);
ok(count(array_filter($rutas, fn ($x) => preg_match('#^(pdf|imagen)/\d{4}/\d{2}/[a-f0-9]{32}\.(pdf|png|jpg|webp)$#', $x))) === count($rutas), 'Los archivos se guardan con nombre aleatorio');
$r = $admin->delete("/semilleros/$idS1");
ok($r['estado'] === 200, 'Borra el semillero');
$archivosDespues = (int) pdo_local()->query('SELECT COUNT(*) FROM archivos')->fetchColumn();
$quedan = count(array_filter($rutas, fn ($x) => is_file(CONFIG['uploads_dir'] . '/' . $x)));
ok($archivosDespues === 0 && $quedan === 0 && $archivosAntes > 0, "Al borrarlo se eliminan sus proyectos, PDFs e imágenes ($archivosAntes archivos)");
ok(is_file(CONFIG['uploads_dir'] . '/.htaccess') && str_contains((string) file_get_contents(CONFIG['uploads_dir'] . '/.htaccess'), 'Require all denied'), 'uploads/.htaccess impide servir y ejecutar archivos');

resumen_final();
