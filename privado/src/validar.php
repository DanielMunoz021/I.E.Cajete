<?php
// Validación de datos de entrada. Si algo no es válido, responde 422 con el mensaje.
declare(strict_types=1);

function invalido(string $campo, string $mensaje): never
{
    error_api($mensaje, 422, ['campo' => $campo]);
}

function texto(array $d, string $campo, string $etiqueta, int $max = 255, bool $requerido = true): ?string
{
    $v = $d[$campo] ?? null;
    if ($v === null || (is_string($v) && trim($v) === '')) {
        if ($requerido) {
            invalido($campo, "$etiqueta es obligatorio.");
        }
        return null;
    }
    if (!is_string($v)) {
        invalido($campo, "$etiqueta no es válido.");
    }
    $v = trim($v);
    if (mb_strlen($v) > $max) {
        invalido($campo, "$etiqueta no puede tener más de $max caracteres.");
    }
    return $v;
}

function correo(array $d, string $campo = 'correo'): string
{
    $v = mb_strtolower((string) texto($d, $campo, 'El correo', 190));
    if (!filter_var($v, FILTER_VALIDATE_EMAIL)) {
        invalido($campo, 'El correo no es válido.');
    }
    return $v;
}

function opcion(array $d, string $campo, string $etiqueta, array $permitidas): string
{
    $v = $d[$campo] ?? null;
    if (!is_string($v) || !in_array($v, $permitidas, true)) {
        invalido($campo, "$etiqueta no es válido.");
    }
    return $v;
}

function booleano(array $d, string $campo, bool $porDefecto = false): bool
{
    if (!array_key_exists($campo, $d)) {
        return $porDefecto;
    }
    return filter_var($d[$campo], FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? $porDefecto;
}

/** Reglas mínimas de contraseña. */
function clave_nueva(array $d, string $campo = 'clave'): string
{
    $v = $d[$campo] ?? '';
    if (!is_string($v) || mb_strlen($v) < 10) {
        invalido($campo, 'La contraseña debe tener al menos 10 caracteres.');
    }
    if (mb_strlen($v) > 200) {
        invalido($campo, 'La contraseña es demasiado larga.');
    }
    if (!preg_match('/[A-Za-zÁÉÍÓÚáéíóúÑñ]/u', $v) || !preg_match('/\d/', $v)) {
        invalido($campo, 'La contraseña debe combinar letras y números.');
    }
    return $v;
}

/** Contraseña temporal aleatoria y legible (sin caracteres que se confunden). */
function clave_temporal(): string
{
    $letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    $numeros = '23456789';
    $todo = $letras . $numeros;
    $c = $letras[random_int(0, strlen($letras) - 1)] . $numeros[random_int(0, strlen($numeros) - 1)];
    for ($i = 0; $i < 10; $i++) {
        $c .= $todo[random_int(0, strlen($todo) - 1)];
    }
    return str_shuffle($c);
}
