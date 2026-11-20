<?php
// Autenticación y permisos. Los permisos se revisan SIEMPRE aquí, en el servidor:
// que la pantalla oculte un botón no protege nada.
declare(strict_types=1);

/** Usuario de la sesión, leído de la base de datos en cada petición (si lo desactivan, pierde el acceso al instante). */
function usuario_actual(): ?array
{
    static $cache = false;
    if ($cache !== false) {
        return $cache;
    }
    $id = $_SESSION['usuario_id'] ?? null;
    if (!is_int($id)) {
        return $cache = null;
    }
    $u = fila('SELECT id, nombre, correo, rol, debe_cambiar_clave, activo FROM usuarios WHERE id = ?', [$id]);
    if (!$u || !(int) $u['activo']) {
        unset($_SESSION['usuario_id']);
        return $cache = null;
    }
    return $cache = $u;
}

/**
 * Exige sesión iniciada. Mientras el usuario tenga la contraseña temporal,
 * solo puede cambiarla (salvo que $permitirClaveTemporal sea true).
 */
function requerir_login(bool $permitirClaveTemporal = false): array
{
    $u = usuario_actual();
    if (!$u) {
        error_api('Inicia sesión para continuar.', 401);
    }
    if (!$permitirClaveTemporal && (int) $u['debe_cambiar_clave']) {
        error_api('Debes cambiar tu contraseña temporal antes de continuar.', 403, ['codigo' => 'cambiar_clave']);
    }
    return $u;
}

function requerir_admin(): array
{
    $u = requerir_login();
    if ($u['rol'] !== 'admin') {
        error_api('No tienes permiso para esta acción.', 403);
    }
    return $u;
}

/** Datos públicos del usuario para la app (nunca el hash). */
function usuario_publico(array $u): array
{
    return [
        'id'               => (int) $u['id'],
        'nombre'           => $u['nombre'],
        'correo'           => $u['correo'],
        'rol'              => $u['rol'],
        'debeCambiarClave' => (bool) (int) $u['debe_cambiar_clave'],
    ];
}

// ---------------------------------------------------------------------
// Límite de intentos de inicio de sesión
// ---------------------------------------------------------------------
function login_bloqueado(string $correo, string $ip): bool
{
    $ventana = (int) config('login_ventana_min', 15);
    $desde = date('Y-m-d H:i:s', time() - $ventana * 60);
    $porCorreo = (int) valor('SELECT COUNT(*) FROM intentos_login WHERE correo = ? AND exitoso = 0 AND creado_en >= ?', [$correo, $desde]);
    $porIp = (int) valor('SELECT COUNT(*) FROM intentos_login WHERE ip = ? AND exitoso = 0 AND creado_en >= ?', [$ip, $desde]);
    return $porCorreo >= (int) config('login_max_por_correo', 5) || $porIp >= (int) config('login_max_por_ip', 20);
}

function registrar_intento(string $correo, string $ip, bool $exitoso): void
{
    q('INSERT INTO intentos_login (correo, ip, exitoso) VALUES (?, ?, ?)', [$correo, $ip, (int) $exitoso]);
    // Limpieza ocasional de registros viejos (más de 30 días)
    if (random_int(1, 50) === 1) {
        q('DELETE FROM intentos_login WHERE creado_en < (NOW() - INTERVAL 30 DAY)');
    }
}
