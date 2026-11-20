<?php
// Magazine escolar Sensaciones: ediciones con portada y PDF.
declare(strict_types=1);

function edicion_json(array $e, bool $admin = false): array
{
    $j = [
        'id'          => (int) $e['id'],
        'numero'      => (int) $e['numero'],
        'titulo'      => $e['titulo'],
        'fecha'       => $e['fecha'],
        'descripcion' => $e['descripcion'],
        // Ediciones históricas usan archivos que ya están en el sitio (docs/, img/)
        'portada'     => url_archivo($e['portada_id'] ? (int) $e['portada_id'] : null) ?? $e['portada_ruta_publica'],
        'pdf'         => url_archivo($e['pdf_id'] ? (int) $e['pdf_id'] : null) ?? $e['pdf_ruta_publica'],
    ];
    if ($admin) {
        $j['publicada'] = (bool) (int) $e['publicada'];
        $j['destacado'] = es_destacado('edicion', (int) $e['id']);
    }
    return $j;
}

function ruta_publico_ediciones(): never
{
    $filas = filas('SELECT * FROM ediciones_sensaciones WHERE publicada = 1 ORDER BY fecha DESC, numero DESC');
    header('Cache-Control: public, max-age=60');
    responder(['ediciones' => array_map('edicion_json', $filas)]);
}

function ruta_ediciones_listar_admin(): never
{
    requerir_admin();
    $filas = filas('SELECT * FROM ediciones_sensaciones ORDER BY fecha DESC, numero DESC');
    responder(['ediciones' => array_map(fn ($e) => edicion_json($e, true), $filas)]);
}

function datos_edicion(?int $id): array
{
    $d = entrada();
    $numero = entero($d, 'numero', 'El número de la edición', true, 1, 9999);
    $repetido = $id
        ? valor('SELECT 1 FROM ediciones_sensaciones WHERE numero = ? AND id <> ?', [$numero, $id])
        : valor('SELECT 1 FROM ediciones_sensaciones WHERE numero = ?', [$numero]);
    if ($repetido) {
        invalido('numero', "Ya existe la edición número $numero.");
    }
    return [
        'numero'      => $numero,
        'titulo'      => texto($d, 'titulo', 'El título', 150),
        'fecha'       => fecha($d, 'fecha', 'La fecha', true),
        'descripcion' => texto($d, 'descripcion', 'La descripción', 5000, false),
        'publicada'   => booleano($d, 'publicada', true),
        'quitar_portada' => booleano($d, 'quitar_portada'),
    ];
}

function ruta_ediciones_crear(): never
{
    $u = requerir_admin();
    verificar_tamano_peticion();
    $d = datos_edicion(null);
    $pdfId = guardar_subida('pdf', 'pdf', (int) $u['id']);
    $portadaId = hay_archivo('portada') ? guardar_subida('portada', 'imagen', (int) $u['id']) : null;
    q(
        'INSERT INTO ediciones_sensaciones (numero, titulo, fecha, descripcion, portada_id, pdf_id, publicada) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [$d['numero'], $d['titulo'], $d['fecha'], $d['descripcion'], $portadaId, $pdfId, (int) $d['publicada']]
    );
    responder(['edicion' => edicion_json(fila('SELECT * FROM ediciones_sensaciones WHERE id = ?', [ultimo_id()]), true)], 201);
}

function ruta_ediciones_editar(int $id): never
{
    $u = requerir_admin();
    verificar_tamano_peticion();
    $actual = fila('SELECT * FROM ediciones_sensaciones WHERE id = ?', [$id]) ?? error_api('La edición no existe.', 404);
    $d = datos_edicion($id);

    $pdfAnterior = $actual['pdf_id'] ? (int) $actual['pdf_id'] : null;
    $portadaAnterior = $actual['portada_id'] ? (int) $actual['portada_id'] : null;
    $pdfId = $pdfAnterior;
    $pdfRuta = $actual['pdf_ruta_publica'];
    if (hay_archivo('pdf')) {
        $pdfId = guardar_subida('pdf', 'pdf', (int) $u['id']);
        $pdfRuta = null;
    }
    $portadaId = $portadaAnterior;
    $portadaRuta = $actual['portada_ruta_publica'];
    if (hay_archivo('portada')) {
        $portadaId = guardar_subida('portada', 'imagen', (int) $u['id']);
        $portadaRuta = null;
    } elseif ($d['quitar_portada']) {
        $portadaId = null;
        $portadaRuta = null;
    }

    q(
        'UPDATE ediciones_sensaciones SET numero = ?, titulo = ?, fecha = ?, descripcion = ?, portada_id = ?, pdf_id = ?,
                pdf_ruta_publica = ?, portada_ruta_publica = ?, publicada = ? WHERE id = ?',
        [$d['numero'], $d['titulo'], $d['fecha'], $d['descripcion'], $portadaId, $pdfId, $pdfRuta, $portadaRuta, (int) $d['publicada'], $id]
    );
    if ($pdfAnterior !== $pdfId) {
        borrar_archivo($pdfAnterior);
    }
    if ($portadaAnterior !== $portadaId) {
        borrar_archivo($portadaAnterior);
    }
    responder(['edicion' => edicion_json(fila('SELECT * FROM ediciones_sensaciones WHERE id = ?', [$id]), true)]);
}

function ruta_ediciones_eliminar(int $id): never
{
    requerir_admin();
    $e = fila('SELECT * FROM ediciones_sensaciones WHERE id = ?', [$id]) ?? error_api('La edición no existe.', 404);
    transaccion(function () use ($id) {
        quitar_destacado('edicion', $id);
        q('DELETE FROM ediciones_sensaciones WHERE id = ?', [$id]);
    });
    borrar_archivo($e['pdf_id'] ? (int) $e['pdf_id'] : null);
    borrar_archivo($e['portada_id'] ? (int) $e['portada_id'] : null);
    responder(['ok' => true]);
}
