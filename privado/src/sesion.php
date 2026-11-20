<?php
// Sesión PHP con cookie segura.
declare(strict_types=1);

const SESION_INACTIVIDAD_SEG = 2 * 60 * 60; // 2 horas sin actividad cierran la sesión

function es_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? '') === '443');
}

function iniciar_sesion_php(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_name('IECAJETE_SESION');
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => es_https(),   // en el hosting siempre es HTTPS; en local (http) no
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();

    $ahora = time();
    if (isset($_SESSION['ultima_actividad']) && $ahora - $_SESSION['ultima_actividad'] > SESION_INACTIVIDAD_SEG) {
        cerrar_sesion_php();
        session_start();
    }
    $_SESSION['ultima_actividad'] = $ahora;
}

function cerrar_sesion_php(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000, 'path' => $p['path'], 'secure' => $p['secure'],
            'httponly' => $p['httponly'], 'samesite' => $p['samesite'],
        ]);
    }
    session_destroy();
}
