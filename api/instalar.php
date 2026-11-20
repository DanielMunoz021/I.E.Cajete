<?php
// Crea el primer administrador. BÓRRALO del hosting después de usarlo.
// (Además se bloquea solo cuando ya existe un admin.)
declare(strict_types=1);

foreach ([__DIR__ . '/../../iecajete-privado/instalar.php', __DIR__ . '/../privado/instalar.php'] as $f) {
    if (is_file($f)) {
        require $f;
        exit;
    }
}
http_response_code(500);
echo 'No se encontró la carpeta privada del portal.';
