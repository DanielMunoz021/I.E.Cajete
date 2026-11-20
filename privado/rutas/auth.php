<?php
// /api/sesion, /api/login, /api/logout, /api/cambiar-clave
declare(strict_types=1);

/** Estado de la sesión + token CSRF. La app lo pide al cargar. */
function ruta_sesion(): never
{
    $u = usuario_actual();
    responder(['usuario' => $u ? usuario_publico($u) : null, 'csrf' => token_csrf()]);
}

function ruta_login(): never
{
    $d = entrada();
    $correo = mb_strtolower(trim((string) ($d['correo'] ?? '')));
    $clave = (string) ($d['clave'] ?? '');
    $ip = ip_cliente();

    if ($correo === '' || $clave === '') {
        error_api('Escribe tu correo y tu contraseña.', 422);
    }
    if (login_bloqueado($correo, $ip)) {
        $min = (int) config('login_ventana_min', 15);
        error_api("Demasiados intentos fallidos. Espera $min minutos e inténtalo de nuevo.", 429);
    }

    $u = fila('SELECT id, clave_hash, activo FROM usuarios WHERE correo = ?', [$correo]);
    // password_verify se ejecuta aunque el usuario no exista, para no revelar qué correos existen por el tiempo de respuesta.
    $hash = $u['clave_hash'] ?? password_hash('usuario-inexistente', PASSWORD_DEFAULT);
    $ok = password_verify($clave, $hash) && $u && (int) $u['activo'];

    registrar_intento($correo, $ip, $ok);
    if (!$ok) {
        error_api('Correo o contraseña incorrectos.', 401);
    }

    if (password_needs_rehash($u['clave_hash'], PASSWORD_DEFAULT)) {
        q('UPDATE usuarios SET clave_hash = ? WHERE id = ?', [password_hash($clave, PASSWORD_DEFAULT), $u['id']]);
    }
    q('UPDATE usuarios SET ultimo_ingreso = NOW() WHERE id = ?', [$u['id']]);

    session_regenerate_id(true); // evita fijación de sesión
    $_SESSION['usuario_id'] = (int) $u['id'];
    $csrf = renovar_csrf();

    responder(['usuario' => usuario_publico(usuario_actual()), 'csrf' => $csrf]);
}

function ruta_logout(): never
{
    cerrar_sesion_php();
    iniciar_sesion_php();
    responder(['ok' => true, 'csrf' => renovar_csrf()]);
}

function ruta_cambiar_clave(): never
{
    $u = requerir_login(permitirClaveTemporal: true);
    $d = entrada();
    $actual = (string) ($d['actual'] ?? '');
    $nueva = clave_nueva($d, 'nueva');

    $hash = (string) valor('SELECT clave_hash FROM usuarios WHERE id = ?', [$u['id']]);
    if (!password_verify($actual, $hash)) {
        invalido('actual', 'La contraseña actual no es correcta.');
    }
    if (password_verify($nueva, $hash)) {
        invalido('nueva', 'La nueva contraseña debe ser distinta de la actual.');
    }
    q('UPDATE usuarios SET clave_hash = ?, debe_cambiar_clave = 0 WHERE id = ?', [password_hash($nueva, PASSWORD_DEFAULT), $u['id']]);

    session_regenerate_id(true);
    $u['debe_cambiar_clave'] = 0;
    responder(['usuario' => usuario_publico($u), 'csrf' => renovar_csrf()]);
}
