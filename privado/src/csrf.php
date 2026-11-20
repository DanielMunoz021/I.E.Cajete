<?php
// Token CSRF. La app lo recibe en GET /api/sesion y lo manda en la cabecera
// X-CSRF-Token en toda petición que cambia datos (POST, PUT, DELETE).
// Los formularios HTML generados por PHP (instalar.php) lo mandan en un campo oculto.
declare(strict_types=1);

function token_csrf(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function verificar_csrf(?string $enviado = null): void
{
    $enviado ??= $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $esperado = $_SESSION['csrf'] ?? '';
    if ($esperado === '' || !is_string($enviado) || !hash_equals($esperado, $enviado)) {
        error_api('La sesión del formulario venció. Recarga la página e inténtalo de nuevo.', 419);
    }
}

/** Nuevo token (al iniciar o cerrar sesión). */
function renovar_csrf(): string
{
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}
