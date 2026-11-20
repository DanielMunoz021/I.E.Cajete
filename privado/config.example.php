<?php
// =====================================================================
// PLANTILLA de configuración. Copia este archivo como config.php
// (en la misma carpeta) y completa los datos. config.php NO va a Git.
// En el hosting esta carpeta va FUERA de public_html:
//   /home/iecajetepopayan/iecajete-privado/config.php
// =====================================================================

return [
    'bd' => [
        'host'    => 'localhost',
        'puerto'  => 3306,
        'nombre'  => 'iecajetepopayan_portal',   // en cPanel lleva el prefijo del usuario
        'usuario' => 'iecajetepopayan_portal',
        'clave'   => 'CAMBIA-ESTA-CLAVE',
    ],

    // 'desarrollo' muestra el detalle de los errores; 'produccion' los oculta.
    'entorno' => 'produccion',

    // Clave que pide instalar.php para crear el primer admin.
    // Pon una larga y aleatoria; después de instalar, borra api/instalar.php.
    'clave_instalacion' => 'CAMBIA-ESTA-CLAVE-DE-INSTALACION',

    // Carpeta de archivos subidos (fuera de public_html). Por defecto: privado/uploads
    'uploads_dir' => __DIR__ . '/uploads',

    // Tamaños máximos en MB (PHP también debe permitirlos: upload_max_filesize y post_max_size)
    'max_pdf_mb'    => 20,
    'max_imagen_mb' => 5,

    // Límite de intentos fallidos de inicio de sesión (ventana en minutos)
    'login_max_por_correo' => 5,
    'login_max_por_ip'     => 20,
    'login_ventana_min'    => 15,
];
