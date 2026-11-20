<?php
// Gestión de usuarios. Solo el admin. No hay registro público.
declare(strict_types=1);

function usuario_fila_publica(array $f): array
{
    return [
        'id'               => (int) $f['id'],
        'nombre'           => $f['nombre'],
        'correo'           => $f['correo'],
        'rol'              => $f['rol'],
        'activo'           => (bool) (int) $f['activo'],
        'debeCambiarClave' => (bool) (int) $f['debe_cambiar_clave'],
        'ultimoIngreso'    => $f['ultimo_ingreso'],
        'creadoEn'         => $f['creado_en'],
    ];
}

function ruta_usuarios_listar(): never
{
    requerir_admin();
    $filas = filas('SELECT id, nombre, correo, rol, activo, debe_cambiar_clave, ultimo_ingreso, creado_en FROM usuarios ORDER BY activo DESC, rol, nombre');
    responder(['usuarios' => array_map('usuario_fila_publica', $filas)]);
}

function ruta_usuarios_crear(): never
{
    requerir_admin();
    $d = entrada();
    $nombre = texto($d, 'nombre', 'El nombre', 120);
    $correo = correo($d);
    $rol = opcion($d, 'rol', 'El rol', ['admin', 'docente']);
    // Si el admin no escribe una contraseña temporal, se genera una.
    $temporal = isset($d['clave']) && trim((string) $d['clave']) !== '' ? clave_nueva($d) : clave_temporal();

    if (valor('SELECT 1 FROM usuarios WHERE correo = ?', [$correo])) {
        invalido('correo', 'Ya existe un usuario con ese correo.');
    }
    q(
        'INSERT INTO usuarios (nombre, correo, rol, clave_hash, debe_cambiar_clave, activo) VALUES (?, ?, ?, ?, 1, 1)',
        [$nombre, $correo, $rol, password_hash($temporal, PASSWORD_DEFAULT)]
    );
    $nuevo = fila('SELECT * FROM usuarios WHERE id = ?', [ultimo_id()]);
    // La contraseña temporal se devuelve UNA sola vez para que el admin se la entregue al usuario.
    responder(['usuario' => usuario_fila_publica($nuevo), 'claveTemporal' => $temporal], 201);
}

function ruta_usuarios_editar(int $id): never
{
    $admin = requerir_admin();
    $actual = fila('SELECT * FROM usuarios WHERE id = ?', [$id]) ?? error_api('El usuario no existe.', 404);
    $d = entrada();

    $nombre = texto($d, 'nombre', 'El nombre', 120);
    $correo = correo($d);
    $rol = opcion($d, 'rol', 'El rol', ['admin', 'docente']);
    $activo = booleano($d, 'activo', (bool) (int) $actual['activo']);

    if (valor('SELECT 1 FROM usuarios WHERE correo = ? AND id <> ?', [$correo, $id])) {
        invalido('correo', 'Ya existe un usuario con ese correo.');
    }
    // Protecciones: el admin no puede quitarse a sí mismo el acceso, y siempre debe quedar al menos un admin activo.
    if ($id === (int) $admin['id'] && (!$activo || $rol !== 'admin')) {
        error_api('No puedes desactivarte ni quitarte el rol de administrador a ti mismo.', 422);
    }
    if ($actual['rol'] === 'admin' && (int) $actual['activo'] && (!$activo || $rol !== 'admin')) {
        $otros = (int) valor("SELECT COUNT(*) FROM usuarios WHERE rol = 'admin' AND activo = 1 AND id <> ?", [$id]);
        if ($otros === 0) {
            error_api('Debe quedar al menos un administrador activo.', 422);
        }
    }

    q('UPDATE usuarios SET nombre = ?, correo = ?, rol = ?, activo = ? WHERE id = ?', [$nombre, $correo, $rol, (int) $activo, $id]);
    responder(['usuario' => usuario_fila_publica(fila('SELECT * FROM usuarios WHERE id = ?', [$id]))]);
}

function ruta_usuarios_restablecer_clave(int $id): never
{
    requerir_admin();
    fila('SELECT id FROM usuarios WHERE id = ?', [$id]) ?? error_api('El usuario no existe.', 404);
    $d = entrada();
    $temporal = isset($d['clave']) && trim((string) $d['clave']) !== '' ? clave_nueva($d) : clave_temporal();
    q('UPDATE usuarios SET clave_hash = ?, debe_cambiar_clave = 1 WHERE id = ?', [password_hash($temporal, PASSWORD_DEFAULT), $id]);
    // Desbloquea al usuario si estaba bloqueado por intentos fallidos.
    q('DELETE FROM intentos_login WHERE correo = (SELECT correo FROM usuarios WHERE id = ?) AND exitoso = 0', [$id]);
    responder(['claveTemporal' => $temporal]);
}
