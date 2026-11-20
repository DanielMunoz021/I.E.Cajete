<?php
// =====================================================================
// Prueba de punta a punta de la fase (a): instalación, login, usuarios,
// roles, CSRF, contraseña temporal y límite de intentos.
//
// ¡BORRA los datos de la base LOCAL! Solo corre con entorno 'desarrollo'.
// Uso (con la API corriendo en 127.0.0.1:8000):
//   php pruebas/fase-a.php --borrar-datos-locales
// =====================================================================
declare(strict_types=1);

require __DIR__ . '/comun.php';

preparar_base_vacia($argv);

$admin = new Cliente();
$docente = new Cliente();

titulo('Sesión y CSRF');
$r = $admin->get('/sesion');
ok($r['estado'] === 200 && $r['json']['usuario'] === null && strlen($r['json']['csrf']) === 64, 'GET /sesion sin usuario entrega token CSRF');
$r = $admin->post('/login', ['correo' => 'x@x.co', 'clave' => 'x'], conCsrf: false);
ok($r['estado'] === 419, 'POST sin token CSRF se rechaza (419)');

titulo('Instalador');
$html = $admin->crudo('GET', '/api/instalar.php');
preg_match('/name="csrf" value="([a-f0-9]{64})"/', $html, $m);
ok(isset($m[1]), 'instalar.php muestra el formulario con token CSRF');
$tokenInstalar = $m[1] ?? '';
$base = ['csrf' => $tokenInstalar, 'nombre' => 'Admin Pruebas', 'correo' => 'admin@pruebas.local', 'clave' => 'ClaveAdmin2026', 'clave2' => 'ClaveAdmin2026'];
$html = $admin->formulario('/api/instalar.php', $base + ['clave_instalacion' => 'incorrecta']);
ok(str_contains($html, 'clave de instalación no es correcta'), 'Rechaza una clave de instalación incorrecta');
$html = $admin->formulario('/api/instalar.php', $base + ['clave_instalacion' => CONFIG['clave_instalacion']]);
ok(str_contains($html, 'Administrador creado'), 'Crea el primer admin con la clave correcta');
$html = $admin->crudo('GET', '/api/instalar.php');
ok(str_contains($html, 'instalador está bloqueado'), 'El instalador queda bloqueado cuando ya hay un admin');
ok(!str_contains($html, '<form'), 'Bloqueado: ya no muestra el formulario');

titulo('Login de admin');
$admin->get('/sesion');
$r = $admin->post('/login', ['correo' => 'admin@pruebas.local', 'clave' => 'mala']);
ok($r['estado'] === 401 && $r['json']['error'] === 'Correo o contraseña incorrectos.', 'Contraseña incorrecta: 401 con mensaje genérico');
$r = $admin->post('/login', ['correo' => 'ADMIN@pruebas.local', 'clave' => 'ClaveAdmin2026']);
ok($r['estado'] === 200 && $r['json']['usuario']['rol'] === 'admin' && !$r['json']['usuario']['debeCambiarClave'], 'Login correcto (el correo no distingue mayúsculas)');
$r = $admin->get('/panel/resumen');
ok($r['estado'] === 200 && $r['json']['resumen']['usuarios'] === 1, 'Dashboard del admin con contadores');

titulo('Gestión de usuarios');
$r = $admin->post('/usuarios', ['nombre' => 'Docente Pruebas', 'correo' => 'docente@pruebas.local', 'rol' => 'docente']);
ok($r['estado'] === 201 && strlen($r['json']['claveTemporal']) === 12, 'Crea docente y genera contraseña temporal');
$temporal = $r['json']['claveTemporal'];
$idDocente = $r['json']['usuario']['id'];
$r = $admin->post('/usuarios', ['nombre' => 'Otro', 'correo' => 'docente@pruebas.local', 'rol' => 'docente']);
ok($r['estado'] === 422 && $r['json']['campo'] === 'correo', 'No permite correos repetidos');
$r = $admin->post('/usuarios', ['nombre' => 'Otro', 'correo' => 'no-es-correo', 'rol' => 'docente']);
ok($r['estado'] === 422, 'Valida el formato del correo');
$r = $admin->post('/usuarios', ['nombre' => 'Otro', 'correo' => 'otro@pruebas.local', 'rol' => 'superusuario']);
ok($r['estado'] === 422, 'Valida el rol');
$r = $admin->put('/usuarios/1', ['nombre' => 'Admin Pruebas', 'correo' => 'admin@pruebas.local', 'rol' => 'docente', 'activo' => true]);
ok($r['estado'] === 422, 'El admin no puede quitarse su propio rol');
$r = $admin->get('/usuarios');
ok($r['estado'] === 200 && count($r['json']['usuarios']) === 2 && !isset($r['json']['usuarios'][0]['clave_hash']), 'Lista usuarios sin exponer hashes');

titulo('Docente: contraseña temporal y permisos');
$docente->get('/sesion');
$r = $docente->post('/login', ['correo' => 'docente@pruebas.local', 'clave' => $temporal]);
ok($r['estado'] === 200 && $r['json']['usuario']['debeCambiarClave'] === true, 'Entra con la temporal y se le pide cambiarla');
$r = $docente->get('/panel/resumen');
ok($r['estado'] === 403 && ($r['json']['codigo'] ?? '') === 'cambiar_clave', 'Con clave temporal no puede hacer nada más');
$r = $docente->post('/cambiar-clave', ['actual' => $temporal, 'nueva' => 'corta1']);
ok($r['estado'] === 422, 'Rechaza contraseñas débiles');
$r = $docente->post('/cambiar-clave', ['actual' => 'equivocada', 'nueva' => 'NuevaClave2026']);
ok($r['estado'] === 422 && $r['json']['campo'] === 'actual', 'Exige la contraseña actual correcta');
$r = $docente->post('/cambiar-clave', ['actual' => $temporal, 'nueva' => 'NuevaClave2026']);
ok($r['estado'] === 200 && $r['json']['usuario']['debeCambiarClave'] === false, 'Cambia la temporal por una propia');
$r = $docente->get('/panel/resumen');
ok($r['estado'] === 200 && isset($r['json']['resumen']['aprobados']), 'Ve su dashboard reducido de docente');
$r = $docente->get('/usuarios');
ok($r['estado'] === 403, 'Docente NO puede listar usuarios (el servidor lo bloquea)');
$r = $docente->post('/usuarios', ['nombre' => 'Intruso', 'correo' => 'intruso@pruebas.local', 'rol' => 'admin']);
ok($r['estado'] === 403, 'Docente NO puede crear usuarios');
$r = $docente->post("/usuarios/1/restablecer-clave");
ok($r['estado'] === 403, 'Docente NO puede restablecer claves ajenas');

titulo('Desactivar y restablecer');
$r = $admin->put("/usuarios/$idDocente", ['nombre' => 'Docente Pruebas', 'correo' => 'docente@pruebas.local', 'rol' => 'docente', 'activo' => false]);
ok($r['estado'] === 200 && $r['json']['usuario']['activo'] === false, 'El admin desactiva al docente');
$r = $docente->get('/sesion');
ok($r['estado'] === 200 && $r['json']['usuario'] === null, 'Al desactivarlo pierde la sesión de inmediato');
$r = $docente->post('/login', ['correo' => 'docente@pruebas.local', 'clave' => 'NuevaClave2026']);
ok($r['estado'] === 401, 'Una cuenta desactivada no puede entrar');
$admin->put("/usuarios/$idDocente", ['nombre' => 'Docente Pruebas', 'correo' => 'docente@pruebas.local', 'rol' => 'docente', 'activo' => true]);
$r = $admin->post("/usuarios/$idDocente/restablecer-clave");
ok($r['estado'] === 200 && strlen($r['json']['claveTemporal']) === 12, 'Restablece la clave con una nueva temporal');
$r = $docente->post('/login', ['correo' => 'docente@pruebas.local', 'clave' => $r['json']['claveTemporal']]);
ok($r['estado'] === 200 && $r['json']['usuario']['debeCambiarClave'] === true, 'Tras restablecer, vuelve a pedir cambio de clave');

titulo('Límite de intentos de login');
$atacante = new Cliente();
$atacante->get('/sesion');
for ($i = 0; $i < 5; $i++) {
    $atacante->post('/login', ['correo' => 'admin@pruebas.local', 'clave' => "mala$i"]);
}
$r = $atacante->post('/login', ['correo' => 'admin@pruebas.local', 'clave' => 'ClaveAdmin2026']);
ok($r['estado'] === 429, 'Tras 5 fallos se bloquea el correo, incluso con la clave correcta (429)');

titulo('Cerrar sesión');
$r = $admin->post('/logout');
ok($r['estado'] === 200, 'Logout');
$r = $admin->get('/usuarios');
ok($r['estado'] === 401, 'Después de salir, la API exige login');

resumen_final();
