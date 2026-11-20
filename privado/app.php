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
require RAIZ_PRIVADA . '/src/archivos.php';
require RAIZ_PRIVADA . '/src/contenido.php';

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

    // Archivos subidos (con control de permisos)
    ['GET',  '/archivo/{id}',                      'archivos',   'ruta_archivo'],

    // Semilleros, proyectos y documentos (los formularios con archivos van por POST multipart)
    ['GET',    '/admin/semilleros',                'semilleros', 'ruta_semilleros_listar_admin'],
    ['POST',   '/semilleros',                      'semilleros', 'ruta_semilleros_crear'],
    ['POST',   '/semilleros/{id}',                 'semilleros', 'ruta_semilleros_editar'],
    ['DELETE', '/semilleros/{id}',                 'semilleros', 'ruta_semilleros_eliminar'],
    ['GET',    '/admin/proyectos',                 'proyectos',  'ruta_proyectos_listar_admin'],
    ['POST',   '/proyectos',                       'proyectos',  'ruta_proyectos_crear'],
    ['POST',   '/proyectos/{id}',                  'proyectos',  'ruta_proyectos_editar'],
    ['DELETE', '/proyectos/{id}',                  'proyectos',  'ruta_proyectos_eliminar'],
    ['GET',    '/admin/documentos',                'documentos', 'ruta_documentos_listar_admin'],
    ['POST',   '/documentos',                      'documentos', 'ruta_documentos_crear'],
    ['POST',   '/documentos/{id}',                 'documentos', 'ruta_documentos_editar'],
    ['DELETE', '/documentos/{id}',                 'documentos', 'ruta_documentos_eliminar'],

    // Magazine Sensaciones
    ['GET',    '/admin/ediciones',                 'sensaciones', 'ruta_ediciones_listar_admin'],
    ['POST',   '/ediciones',                       'sensaciones', 'ruta_ediciones_crear'],
    ['POST',   '/ediciones/{id}',                  'sensaciones', 'ruta_ediciones_editar'],
    ['DELETE', '/ediciones/{id}',                  'sensaciones', 'ruta_ediciones_eliminar'],

    // Destacados en inicio
    ['POST',   '/destacados',                      'destacados', 'ruta_destacados_alternar'],
    ['GET',    '/admin/destacados',                'destacados', 'ruta_destacados_listar_admin'],
    ['POST',   '/destacados/orden',                'destacados', 'ruta_destacados_ordenar'],
    ['PUT',    '/destacados/{id}',                 'destacados', 'ruta_destacados_editar'],
    ['DELETE', '/destacados/{id}',                 'destacados', 'ruta_destacados_eliminar'],

    // Público
    ['GET',  '/publico/destacados',                'destacados', 'ruta_publico_destacados'],
    ['GET',  '/publico/ediciones',                 'sensaciones', 'ruta_publico_ediciones'],
    ['GET',  '/publico/semilleros',                'semilleros', 'ruta_publico_semilleros'],
    ['GET',  '/publico/semilleros/{slug}',         'semilleros', 'ruta_publico_semillero'],
];

despachar($RUTAS);

function despachar(array $rutas): void
{
    $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $ruta = ruta_solicitada();

    $existeRuta = false;
    foreach ($rutas as [$m, $patron, $archivo, $funcion]) {
        $regex = '#^' . strtr($patron, ['{id}' => '(\d+)', '{slug}' => '([a-z0-9-]+)', '{tipo}' => '(proyecto|documento)']) . '$#';
        if (!preg_match($regex, $ruta, $coincidencias)) {
            continue;
        }
        $existeRuta = true;
        if ($m !== $metodo) {
            continue;
        }
        // Toda petición que cambia datos exige el token CSRF.
        if ($metodo !== 'GET') {
            verificar_csrf();
        }
        require_once RAIZ_PRIVADA . "/rutas/{$archivo}.php";
        $args = array_map(fn ($a) => ctype_digit($a) ? (int) $a : $a, array_slice($coincidencias, 1));
        $funcion(...$args);
        return;
    }
    $existeRuta ? error_api('Método no permitido.', 405) : error_api('Ruta no encontrada.', 404);
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
