<?php
// =====================================================================
// Instalación: crea el PRIMER administrador.
// - Pide la clave_instalacion de config.php.
// - Se bloquea sola si ya existe algún admin.
// - Después de usarla, borra public_html/api/instalar.php.
// =====================================================================
declare(strict_types=1);

const RAIZ_PRIVADA = __DIR__;
$GLOBALS['CONFIG'] = is_file(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : null;

require __DIR__ . '/src/http.php';
require __DIR__ . '/src/bd.php';
require __DIR__ . '/src/sesion.php';
require __DIR__ . '/src/csrf.php';

header('Content-Type: text/html; charset=utf-8');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function h(?string $t): string
{
    return htmlspecialchars((string) $t, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$errores = [];
$listo = false;
$bloqueado = false;
$datos = ['nombre' => '', 'correo' => ''];

if ($GLOBALS['CONFIG'] === null) {
    $errores[] = 'Falta config.php en la carpeta privada. Copia config.example.php como config.php y complétalo.';
    $bloqueado = true;
} else {
    iniciar_sesion_php();
    try {
        $bloqueado = (bool) valor("SELECT 1 FROM usuarios WHERE rol = 'admin' LIMIT 1");
    } catch (PDOException $e) {
        $errores[] = 'No se pudo conectar a la base de datos o falta importar schema.sql. Revisa config.php.';
        $bloqueado = true;
        error_log('[portal-iecajete] instalar: ' . $e->getMessage());
    }

    if (!$bloqueado && ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
        $enviado = (string) ($_POST['csrf'] ?? '');
        if (!hash_equals($_SESSION['csrf'] ?? '', $enviado)) {
            $errores[] = 'El formulario venció. Recarga la página.';
        } else {
            $datos['nombre'] = trim((string) ($_POST['nombre'] ?? ''));
            $datos['correo'] = mb_strtolower(trim((string) ($_POST['correo'] ?? '')));
            $clave = (string) ($_POST['clave'] ?? '');
            $clave2 = (string) ($_POST['clave2'] ?? '');
            $instalacion = (string) ($_POST['clave_instalacion'] ?? '');

            $esperada = (string) config('clave_instalacion', '');
            if ($esperada === '' || str_starts_with($esperada, 'CAMBIA-') || !hash_equals($esperada, $instalacion)) {
                $errores[] = 'La clave de instalación no es correcta (o no se ha cambiado la de ejemplo en config.php).';
            }
            if ($datos['nombre'] === '' || mb_strlen($datos['nombre']) > 120) {
                $errores[] = 'Escribe el nombre (máximo 120 caracteres).';
            }
            if (!filter_var($datos['correo'], FILTER_VALIDATE_EMAIL)) {
                $errores[] = 'El correo no es válido.';
            }
            if (mb_strlen($clave) < 10 || !preg_match('/[A-Za-z]/', $clave) || !preg_match('/\d/', $clave)) {
                $errores[] = 'La contraseña debe tener al menos 10 caracteres y combinar letras y números.';
            }
            if ($clave !== $clave2) {
                $errores[] = 'Las contraseñas no coinciden.';
            }

            if (!$errores) {
                // Esta contraseña la eligió el propio admin: no se le obliga a cambiarla.
                q(
                    "INSERT INTO usuarios (nombre, correo, rol, clave_hash, debe_cambiar_clave, activo) VALUES (?, ?, 'admin', ?, 0, 1)",
                    [$datos['nombre'], $datos['correo'], password_hash($clave, PASSWORD_DEFAULT)]
                );
                $listo = true;
                renovar_csrf();
            }
        }
    }
}
$csrf = isset($_SESSION) ? token_csrf() : '';
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Instalación · Portal Docente IE Cajete</title>
  <style>
    :root { --verde: #007a52; --amarillo: #ffef00; --texto: #171717; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, sans-serif; background: #fffbdd; color: var(--texto); }
    main { max-width: 460px; margin: 48px auto; background: #fff; border-radius: 14px; padding: 32px; border-top: 6px solid var(--amarillo); box-shadow: 0 10px 30px rgb(0 122 82 / .12); }
    h1 { margin: 0 0 6px; font-size: 24px; font-weight: 500; }
    p { line-height: 1.5; }
    label { display: block; margin-top: 14px; font-weight: 600; font-size: 14px; }
    input { width: 100%; margin-top: 6px; padding: 11px 13px; border: 1.5px solid #d4d4d4; border-radius: 10px; font: inherit; }
    button { margin-top: 20px; background: var(--verde); color: #fff; border: 0; padding: 12px 20px; border-radius: 12px; font: inherit; font-weight: 600; cursor: pointer; }
    .error { background: #fdecec; color: #9a1c14; padding: 10px 14px; border-radius: 10px; }
    .ok { background: #e6f5ef; color: #005c3e; padding: 12px 14px; border-radius: 10px; }
  </style>
</head>
<body>
<main>
  <h1>Portal Docente · Instalación</h1>
  <?php if ($listo): ?>
    <p class="ok"><strong>Administrador creado.</strong> Ya puedes entrar al portal con <?= h($datos['correo']) ?>.</p>
    <p><strong>Importante:</strong> borra ahora el archivo <code>public_html/api/instalar.php</code> del hosting.</p>
  <?php elseif ($bloqueado): ?>
    <?php foreach ($errores as $e): ?><p class="error"><?= h($e) ?></p><?php endforeach; ?>
    <?php if (!$errores): ?>
      <p class="ok">La instalación ya se hizo: existe al menos un administrador. Este instalador está bloqueado.</p>
      <p>Por seguridad, borra <code>public_html/api/instalar.php</code> si sigue en el hosting.</p>
    <?php endif; ?>
  <?php else: ?>
    <p>Crea la cuenta del primer administrador del portal.</p>
    <?php foreach ($errores as $e): ?><p class="error"><?= h($e) ?></p><?php endforeach; ?>
    <form method="post" autocomplete="off">
      <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
      <label>Clave de instalación (está en config.php)
        <input type="password" name="clave_instalacion" required>
      </label>
      <label>Nombre completo
        <input name="nombre" value="<?= h($datos['nombre']) ?>" maxlength="120" required>
      </label>
      <label>Correo
        <input type="email" name="correo" value="<?= h($datos['correo']) ?>" maxlength="190" required>
      </label>
      <label>Contraseña (mínimo 10 caracteres, letras y números)
        <input type="password" name="clave" minlength="10" required autocomplete="new-password">
      </label>
      <label>Repite la contraseña
        <input type="password" name="clave2" minlength="10" required autocomplete="new-password">
      </label>
      <button type="submit">Crear administrador</button>
    </form>
  <?php endif; ?>
</main>
</body>
</html>
