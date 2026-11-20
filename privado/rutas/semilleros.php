<?php
// Semilleros: gestión (admin) y páginas públicas.
declare(strict_types=1);

const SQL_SEMILLEROS = 'SELECT s.*, u.nombre AS lider_nombre FROM semilleros s LEFT JOIN usuarios u ON u.id = s.lider_id';

function ruta_semilleros_listar_admin(): never
{
    requerir_admin();
    $filas = filas(SQL_SEMILLEROS . ' ORDER BY s.activo DESC, s.nombre');
    $lista = array_map(function ($s) {
        $j = semillero_json($s, true);
        $j['proyectos'] = (int) valor('SELECT COUNT(*) FROM proyectos WHERE semillero_id = ?', [$s['id']]);
        return $j;
    }, $filas);
    responder(['semilleros' => $lista]);
}

/** Datos del formulario de semillero (crear y editar). */
function datos_semillero(): array
{
    $d = entrada();
    $liderId = entero($d, 'lider_id', 'El docente líder', false, 1);
    if ($liderId && !valor('SELECT 1 FROM usuarios WHERE id = ? AND activo = 1', [$liderId])) {
        invalido('lider_id', 'El docente líder no existe o está desactivado.');
    }
    $docentes = lista_ids($d, 'docentes');
    foreach ($docentes as $id) {
        if (!valor("SELECT 1 FROM usuarios WHERE id = ? AND rol = 'docente'", [$id])) {
            invalido('docentes', 'Uno de los docentes asignados no existe.');
        }
    }
    return [
        'nombre'      => texto($d, 'nombre', 'El nombre', 150),
        'descripcion' => texto($d, 'descripcion', 'La descripción', 5000, false),
        'lider_id'    => $liderId,
        'activo'      => booleano($d, 'activo', true),
        'docentes'    => $docentes,
        'quitar_imagen' => booleano($d, 'quitar_imagen'),
    ];
}

function guardar_docentes_semillero(int $semilleroId, array $docentes): void
{
    q('DELETE FROM semillero_docentes WHERE semillero_id = ?', [$semilleroId]);
    foreach ($docentes as $uid) {
        q('INSERT INTO semillero_docentes (semillero_id, usuario_id) VALUES (?, ?)', [$semilleroId, $uid]);
    }
}

function ruta_semilleros_crear(): never
{
    $u = requerir_admin();
    verificar_tamano_peticion();
    $d = datos_semillero();
    $imagenId = hay_archivo('imagen') ? guardar_subida('imagen', 'imagen', (int) $u['id']) : null;

    $id = transaccion(function () use ($d, $imagenId) {
        q(
            'INSERT INTO semilleros (nombre, slug, descripcion, lider_id, imagen_id, activo) VALUES (?, ?, ?, ?, ?, ?)',
            [$d['nombre'], slug_unico('semilleros', $d['nombre']), $d['descripcion'], $d['lider_id'], $imagenId, (int) $d['activo']]
        );
        $id = ultimo_id();
        guardar_docentes_semillero($id, $d['docentes']);
        return $id;
    });
    responder(['semillero' => semillero_json(fila(SQL_SEMILLEROS . ' WHERE s.id = ?', [$id]), true)], 201);
}

function ruta_semilleros_editar(int $id): never
{
    $u = requerir_admin();
    verificar_tamano_peticion();
    $actual = fila('SELECT * FROM semilleros WHERE id = ?', [$id]) ?? error_api('El semillero no existe.', 404);
    $d = datos_semillero();
    $imagenAnterior = $actual['imagen_id'] ? (int) $actual['imagen_id'] : null;
    $imagenId = $imagenAnterior;
    if (hay_archivo('imagen')) {
        $imagenId = guardar_subida('imagen', 'imagen', (int) $u['id']);
    } elseif ($d['quitar_imagen']) {
        $imagenId = null;
    }

    transaccion(function () use ($id, $d, $imagenId, $actual) {
        $slug = $d['nombre'] === $actual['nombre'] ? $actual['slug'] : slug_unico('semilleros', $d['nombre'], $id);
        q(
            'UPDATE semilleros SET nombre = ?, slug = ?, descripcion = ?, lider_id = ?, imagen_id = ?, activo = ? WHERE id = ?',
            [$d['nombre'], $slug, $d['descripcion'], $d['lider_id'], $imagenId, (int) $d['activo'], $id]
        );
        guardar_docentes_semillero($id, $d['docentes']);
    });
    if ($imagenAnterior !== $imagenId) {
        borrar_archivo($imagenAnterior);
    }
    responder(['semillero' => semillero_json(fila(SQL_SEMILLEROS . ' WHERE s.id = ?', [$id]), true)]);
}

function ruta_semilleros_eliminar(int $id): never
{
    requerir_admin();
    $s = fila('SELECT * FROM semilleros WHERE id = ?', [$id]) ?? error_api('El semillero no existe.', 404);

    // Archivos y destacados de todo lo que cuelga del semillero
    $proyectos = filas('SELECT id, imagen_id FROM proyectos WHERE semillero_id = ?', [$id]);
    $idsProyectos = array_map('intval', array_column($proyectos, 'id'));
    $docs = filas(
        'SELECT id, archivo_id FROM documentos WHERE semillero_id = ?' . ($idsProyectos ? ' OR proyecto_id IN (' . implode(',', $idsProyectos) . ')' : ''),
        [$id]
    );
    $archivos = array_merge(
        [$s['imagen_id']],
        array_column($proyectos, 'imagen_id'),
        array_column($docs, 'archivo_id')
    );

    transaccion(function () use ($id, $idsProyectos, $docs) {
        quitar_destacado('semillero', $id);
        foreach ($idsProyectos as $p) {
            quitar_destacado('proyecto', $p);
        }
        foreach ($docs as $doc) {
            quitar_destacado('documento', (int) $doc['id']);
        }
        q('DELETE FROM semilleros WHERE id = ?', [$id]); // proyectos, documentos y asignaciones caen en cascada
    });
    foreach (array_filter($archivos) as $a) {
        borrar_archivo((int) $a);
    }
    responder(['ok' => true]);
}

// ---------------------------------------------------------------------
// Público
// ---------------------------------------------------------------------
function ruta_publico_semilleros(): never
{
    $filas = filas(SQL_SEMILLEROS . ' WHERE s.activo = 1 ORDER BY s.nombre');
    $lista = array_map(function ($s) {
        $j = semillero_json($s);
        $j['proyectos'] = (int) valor("SELECT COUNT(*) FROM proyectos WHERE semillero_id = ? AND revision = 'aprobado'", [$s['id']]);
        $j['documentos'] = (int) valor(
            "SELECT COUNT(*) FROM documentos d LEFT JOIN proyectos p ON p.id = d.proyecto_id
             WHERE d.revision = 'aprobado' AND (d.semillero_id = ? OR (p.semillero_id = ? AND p.revision = 'aprobado'))",
            [$s['id'], $s['id']]
        );
        return $j;
    }, $filas);
    header('Cache-Control: public, max-age=60');
    responder(['semilleros' => $lista]);
}

function ruta_publico_semillero(string $slug): never
{
    $s = fila(SQL_SEMILLEROS . ' WHERE s.slug = ? AND s.activo = 1', [$slug]) ?? error_api('El semillero no existe.', 404);
    $proyectos = filas(SQL_PROYECTOS . " WHERE p.semillero_id = ? AND p.revision = 'aprobado' ORDER BY p.anio DESC, p.titulo", [$s['id']]);
    $docs = filas(SQL_DOCUMENTOS . " WHERE d.revision = 'aprobado' AND (d.semillero_id = ? OR d.proyecto_id IN (SELECT id FROM proyectos WHERE semillero_id = ? AND revision = 'aprobado')) ORDER BY d.fecha DESC, d.id DESC", [$s['id'], $s['id']]);

    $docsJson = array_map('documento_json', $docs);
    $proyectosJson = array_map(function ($p) use ($docsJson) {
        $j = proyecto_json($p);
        $j['documentos'] = array_values(array_filter($docsJson, fn ($d) => $d['proyectoId'] === $j['id']));
        return $j;
    }, $proyectos);

    header('Cache-Control: public, max-age=60');
    responder([
        'semillero'  => semillero_json($s),
        'proyectos'  => $proyectosJson,
        'documentos' => array_values(array_filter($docsJson, fn ($d) => $d['semilleroId'] !== null)),
    ]);
}
