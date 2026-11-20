<?php
// Enrutador del servidor LOCAL de PHP: sirve el sitio compilado (sitio/) y la API (/api) en un solo puerto.
//   php -S 127.0.0.1:8000 -t sitio herramientas/router-local.php
// Equivale a lo que hacen los .htaccess en el hosting. Solo para uso local.
declare(strict_types=1);

$ruta = rawurldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));
$sitio = realpath(__DIR__ . '/../sitio');

// 1. La API
if ($ruta === '/api' || str_starts_with($ruta, '/api/')) {
    require __DIR__ . '/../api/index.php';
    return true;
}

// 2. Archivos reales del sitio (imágenes, PDFs, favicon…): que los entregue el servidor
$archivo = realpath($sitio . $ruta);
if ($ruta !== '/' && $archivo !== false && str_starts_with($archivo, $sitio) && is_file($archivo)) {
    return false;
}

// 3. Cualquier otra ruta es una página de la app (React Router)
header('Content-Type: text/html; charset=utf-8');
readfile($sitio . '/index.html');
return true;
