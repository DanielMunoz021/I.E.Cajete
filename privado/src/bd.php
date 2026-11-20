<?php
// Conexión PDO y ayudantes. TODAS las consultas usan sentencias preparadas:
// los datos del usuario siempre van como parámetros, nunca dentro del SQL.
declare(strict_types=1);

function bd(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $c = config('bd');
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['host'], (int) ($c['puerto'] ?? 3306), $c['nombre']);
    $pdo = new PDO($dsn, $c['usuario'], $c['clave'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_STRINGIFY_FETCHES  => false,
    ]);
    $pdo->exec("SET time_zone = '-05:00'");
    return $pdo;
}

/** Ejecuta una consulta preparada y devuelve la sentencia. */
function q(string $sql, array $parametros = []): PDOStatement
{
    $st = bd()->prepare($sql);
    $st->execute($parametros);
    return $st;
}

/** Primera fila o null. */
function fila(string $sql, array $parametros = []): ?array
{
    $f = q($sql, $parametros)->fetch();
    return $f === false ? null : $f;
}

/** Todas las filas. */
function filas(string $sql, array $parametros = []): array
{
    return q($sql, $parametros)->fetchAll();
}

/** Primer valor de la primera fila. */
function valor(string $sql, array $parametros = []): mixed
{
    $v = q($sql, $parametros)->fetchColumn();
    return $v === false ? null : $v;
}

function ultimo_id(): int
{
    return (int) bd()->lastInsertId();
}

/** Ejecuta $fn dentro de una transacción. */
function transaccion(callable $fn): mixed
{
    $pdo = bd();
    $pdo->beginTransaction();
    try {
        $r = $fn();
        $pdo->commit();
        return $r;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}
