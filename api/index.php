<?php
// Puerta de entrada de la API (va en public_html/api/). La lógica vive fuera de public_html.
declare(strict_types=1);

// Servidor local (php -S ... api/index.php): instalar.php también pasa por aquí.
if (PHP_SAPI === 'cli-server' && str_ends_with((string) parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/api/instalar.php')) {
    require __DIR__ . '/instalar.php';
    exit;
}

$candidatos = [
    __DIR__ . '/../../iecajete-privado/app.php', // hosting: /home/usuario/iecajete-privado
    __DIR__ . '/../privado/app.php',             // desarrollo local: iecajete-web/privado
];
foreach ($candidatos as $app) {
    if (is_file($app)) {
        require $app;
        exit;
    }
}
http_response_code(500);
header('Content-Type: application/json; charset=utf-8');
echo '{"error":"No se encontró la carpeta privada del portal (iecajete-privado)."}';
