<?php
// =====================================================================
// Carga DATOS DE DEMOSTRACIÓN en la base LOCAL para probar el portal.
// ¡Vacía la base local primero! Solo funciona en entorno 'desarrollo'.
// Uso (con la API corriendo):  php herramientas/cargar-demo.php --borrar-datos-locales
// Los textos son de ejemplo: NO subas esta base al hosting.
// =====================================================================
declare(strict_types=1);

require __DIR__ . '/../pruebas/comun.php';

preparar_base_vacia($argv);
pdo_local()->exec((string) file_get_contents(__DIR__ . '/../database/datos-iniciales.sql'));

$img = fn (string $f) => [__DIR__ . "/../frontend/public/img/$f", 'image/jpeg', $f];
$pdf = archivos_de_prueba()['pdf'];

crear_usuario('Administración IE Cajete', 'admin@demo.local', 'AdminDemo2026', 'admin');
$idLaura = crear_usuario('Laura Docente (demo)', 'laura@demo.local', 'LauraDemo2026', 'docente');
$idPedro = crear_usuario('Pedro Docente (demo)', 'pedro@demo.local', 'PedroDemo2026', 'docente');
$admin = cliente_con_sesion('admin@demo.local', 'AdminDemo2026');

function crear(Cliente $c, string $ruta, array $campos, array $archivos = []): array
{
    $r = $c->subir($ruta, $campos, $archivos);
    if ($r['estado'] >= 300) {
        fwrite(STDERR, "Error en $ruta: {$r['cuerpo']}\n");
        exit(1);
    }
    return array_values($r['json'])[0];
}

$amb = crear($admin, '/semilleros', ['nombre' => 'Ciencias Ambientales (demo)', 'descripcion' => "Semillero de ejemplo para probar el portal.\nEstudiamos el agua, el suelo y los bosques de la vereda.", 'lider_id' => $idLaura, 'docentes' => "$idLaura"], ['imagen' => $img('sede-dibujo.jpg')]);
$tec = crear($admin, '/semilleros', ['nombre' => 'Tecnología y Robótica (demo)', 'descripcion' => 'Semillero de ejemplo: programación y robótica con material reciclado.', 'lider_id' => $idPedro, 'docentes' => "$idPedro,$idLaura"], ['imagen' => $img('galeria/deporte.jpg')]);

$p1 = crear($admin, '/proyectos', ['semillero_id' => $amb['id'], 'titulo' => 'Calidad del agua del río (demo)', 'resumen' => 'Proyecto de ejemplo: medición de pH y turbidez en tres puntos del río.', 'integrantes' => "Estudiante 1\nEstudiante 2", 'anio' => '2026', 'estado' => 'en_curso'], ['imagen' => $img('galeria/mural.jpg')]);
$p2 = crear($admin, '/proyectos', ['semillero_id' => $tec['id'], 'titulo' => 'Brazo robótico reciclado (demo)', 'resumen' => 'Proyecto de ejemplo con servomotores y cartón.', 'anio' => '2025', 'estado' => 'finalizado'], []);
crear($admin, '/documentos', ['proyecto_id' => $p1['id'], 'titulo' => 'Informe de mediciones (demo)', 'descripcion' => 'PDF de ejemplo.', 'fecha' => '2026-10-15'], ['pdf' => $pdf]);
$doc2 = crear($admin, '/documentos', ['semillero_id' => $tec['id'], 'titulo' => 'Póster de la feria (demo)', 'fecha' => '2026-09-20'], ['pdf' => $pdf]);

// Envíos de la docente que quedan pendientes
$laura = cliente_con_sesion('laura@demo.local', 'LauraDemo2026');
$prop = crear($laura, '/proyectos', ['semillero_id' => $amb['id'], 'titulo' => 'Huerta escolar (propuesta demo)', 'resumen' => 'Propuesta de ejemplo enviada por una docente: queda pendiente.', 'anio' => '2026'], []);
crear($laura, '/documentos', ['proyecto_id' => $p1['id'], 'titulo' => 'Avance de mediciones (envío demo)'], ['pdf' => $pdf]);

// Destacados del inicio
$idE3 = (int) pdo_local()->query('SELECT id FROM ediciones_sensaciones WHERE numero = 3')->fetchColumn();
foreach ([['edicion', $idE3], ['semillero', $amb['id']], ['proyecto', $p2['id']], ['documento', $doc2['id']]] as [$tipo, $id]) {
    $admin->post('/destacados', ['tipo' => $tipo, 'elemento_id' => $id, 'activo' => true]);
}

echo <<<TXT

Datos de demostración cargados.
  Admin:    admin@demo.local / AdminDemo2026
  Docente:  laura@demo.local / LauraDemo2026   (2 semilleros; tiene 2 envíos pendientes)
  Docente:  pedro@demo.local / PedroDemo2026

TXT;
