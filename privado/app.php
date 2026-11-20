<?php
// =====================================================================
// Arranque de la API del Portal Docente.
// public_html/api/index.php incluye este archivo; todo lo demás vive
// aquí, FUERA de public_html.
// =====================================================================
declare(strict_types=1);

const RAIZ_PRIVADA = __DIR__;

$rutaConfig = RAIZ_PRIVADA . '/config.php';
if (!is_file($rutaConfig)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Falta config.php. Copia config.example.php como config.php y complétalo.']);
    exit;
}
$GLOBALS['CONFIG'] = require $rutaConfig;

require RAIZ_PRIVADA . '/src/http.php';
require RAIZ_PRIVADA . '/src/bd.php';
require RAIZ_PRIVADA . '/src/validar.php';
require RAIZ_PRIVADA . '/src/sesion.php';
require RAIZ_PRIVADA . '/src/csrf.php';
require RAIZ_PRIVADA . '/src/auth.php';

configurar_errores();
cabeceras_seguridad_api();
iniciar_sesion_php();

// ---------------------------------------------------------------------
// Rutas: [método, patrón, archivo, función]. {id} = entero.
// ---------------------------------------------------------------------
$RUTAS = [
    ['GET',  '/sesion',                            'auth',     'ruta_sesion'],
    ['POST', '/login',                             'auth',     'ruta_login'],
    ['POST', '/logout',                            'auth',     'ruta_logout'],
    ['POST', '/cambiar-clave',                     'auth',     'ruta_cambiar_clave'],

    ['GET',  '/panel/resumen',                     'panel',    'ruta_panel_resumen'],

    ['GET',  '/usuarios',                          'usuarios', 'ruta_usuarios_listar'],
    ['POST', '/usuarios',                          'usuarios', 'ruta_usuarios_crear'],
    ['PUT',  '/usuarios/{id}',                     'usuarios', 'ruta_usuarios_editar'],
    ['POST', '/usuarios/{id}/restablecer-clave',   'usuarios', 'ruta_usuarios_restablecer_clave'],
];

despachar($RUTAS);

function despachar(array $rutas): void
{
    $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $ruta = ruta_solicitada();

    foreach ($rutas as [$m, $patron, $archivo, $funcion]) {
        $regex = '#^' . str_replace('{id}', '(\d+)', $patron) . '$#';
        if (!preg_match($regex, $ruta, $coincidencias)) {
            continue;
        }
        if ($m !== $metodo) {
            continue;
        }
        // Toda petición que cambia datos exige el token CSRF.
        if ($metodo !== 'GET') {
            verificar_csrf();
        }
        require_once RAIZ_PRIVADA . "/rutas/{$archivo}.php";
        $args = array_map('intval', array_slice($coincidencias, 1));
        $funcion(...$args);
        return;
    }
    error_api('Ruta no encontrada.', 404);
}

/** Devuelve la ruta después de /api, por ejemplo "/usuarios/3". */
function ruta_solicitada(): string
{
    $ruta = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $pos = strpos($ruta, '/api/');
    $ruta = $pos === false ? $ruta : substr($ruta, $pos + 4);
    $ruta = '/' . trim($ruta, '/');
    return $ruta;
}
