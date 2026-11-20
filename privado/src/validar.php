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

/** Entero opcional (null si viene vacío). */
function entero(array $d, string $campo, string $etiqueta, bool $requerido = false, int $min = 0, int $max = PHP_INT_MAX): ?int
{
    $v = $d[$campo] ?? null;
    if ($v === null || $v === '') {
        if ($requerido) {
            invalido($campo, "$etiqueta es obligatorio.");
        }
        return null;
    }
    $n = filter_var($v, FILTER_VALIDATE_INT);
    if ($n === false || $n < $min || $n > $max) {
        invalido($campo, "$etiqueta no es válido.");
    }
    return $n;
}

/** Fecha AAAA-MM-DD opcional. */
function fecha(array $d, string $campo, string $etiqueta, bool $requerido = false): ?string
{
    $v = $d[$campo] ?? null;
    if ($v === null || $v === '') {
        if ($requerido) {
            invalido($campo, "$etiqueta es obligatoria.");
        }
        return null;
    }
    $f = DateTime::createFromFormat('!Y-m-d', (string) $v);
    if (!$f || $f->format('Y-m-d') !== $v) {
        invalido($campo, "$etiqueta no es una fecha válida.");
    }
    return $v;
}

/** Lista de enteros (por ejemplo, ids de docentes). Acepta arreglo o "1,2,3". */
function lista_ids(array $d, string $campo): array
{
    $v = $d[$campo] ?? [];
    if (is_string($v)) {
        $v = $v === '' ? [] : explode(',', $v);
    }
    if (!is_array($v)) {
        invalido($campo, 'La lista no es válida.');
    }
    $ids = [];
    foreach ($v as $x) {
        $n = filter_var($x, FILTER_VALIDATE_INT);
        if ($n === false || $n < 1) {
            invalido($campo, 'La lista no es válida.');
        }
        $ids[] = $n;
    }
    return array_values(array_unique($ids));
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
