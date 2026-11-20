<?php
// Reglas comunes de semilleros, proyectos y documentos.
declare(strict_types=1);

/** Ids de los semilleros asignados a un docente. */
function semilleros_asignados(int $usuarioId): array
{
    return array_map('intval', array_column(filas('SELECT semillero_id FROM semillero_docentes WHERE usuario_id = ?', [$usuarioId]), 'semillero_id'));
}

/** El docente solo trabaja en sus semilleros; el admin, en todos. */
function exigir_semillero_permitido(array $u, int $semilleroId): void
{
    if (!valor('SELECT 1 FROM semilleros WHERE id = ?', [$semilleroId])) {
        invalido('semillero_id', 'El semillero no existe.');
    }
    if ($u['rol'] !== 'admin' && !in_array($semilleroId, semilleros_asignados((int) $u['id']), true)) {
        error_api('Solo puedes enviar contenido a los semilleros que tienes asignados.', 403);
    }
}

/** Revisión inicial: lo que crea el admin queda aprobado; lo que envía un docente, pendiente. */
function revision_inicial(array $u): array
{
    return $u['rol'] === 'admin'
        ? ['revision' => 'aprobado', 'revisado_por' => (int) $u['id'], 'revisado_en' => date('Y-m-d H:i:s')]
        : ['revision' => 'pendiente', 'revisado_por' => null, 'revisado_en' => null];
}

/** Un docente solo puede modificar o borrar sus propios envíos que aún no están aprobados. */
function exigir_puede_modificar(array $u, array $fila): void
{
    if ($u['rol'] === 'admin') {
        return;
    }
    if ((int) $fila['enviado_por'] !== (int) $u['id']) {
        error_api('Solo puedes modificar tus propios envíos.', 403);
    }
    if ($fila['revision'] === 'aprobado') {
        error_api('Este envío ya fue aprobado: pídele a la administración cualquier cambio.', 403);
    }
}

function quitar_destacado(string $tipo, int $id): void
{
    q('DELETE FROM destacados WHERE tipo = ? AND elemento_id = ?', [$tipo, $id]);
}

function es_destacado(string $tipo, int $id): bool
{
    return (bool) valor('SELECT 1 FROM destacados WHERE tipo = ? AND elemento_id = ? AND activo = 1', [$tipo, $id]);
}

// ---------------------------------------------------------------------
// Representación JSON
// ---------------------------------------------------------------------
function semillero_json(array $s, bool $admin = false): array
{
    $j = [
        'id'          => (int) $s['id'],
        'nombre'      => $s['nombre'],
        'slug'        => $s['slug'],
        'descripcion' => $s['descripcion'],
        'lider'       => $s['lider_nombre'] ?? null,
        'imagen'      => url_archivo($s['imagen_id'] ? (int) $s['imagen_id'] : null),
        'activo'      => (bool) (int) $s['activo'],
    ];
    if ($admin) {
        $j['liderId'] = $s['lider_id'] ? (int) $s['lider_id'] : null;
        $j['docentes'] = array_map('intval', array_column(filas('SELECT usuario_id FROM semillero_docentes WHERE semillero_id = ?', [$s['id']]), 'usuario_id'));
        $j['destacado'] = es_destacado('semillero', (int) $s['id']);
    }
    return $j;
}

function proyecto_json(array $p, bool $admin = false): array
{
    $j = [
        'id'          => (int) $p['id'],
        'semilleroId' => (int) $p['semillero_id'],
        'semillero'   => $p['semillero_nombre'] ?? null,
        'titulo'      => $p['titulo'],
        'slug'        => $p['slug'],
        'resumen'     => $p['resumen'],
        'integrantes' => $p['integrantes'] ? array_values(array_filter(array_map('trim', preg_split('/\R/', $p['integrantes'])))) : [],
        'anio'        => $p['anio'] !== null ? (int) $p['anio'] : null,
        'imagen'      => url_archivo($p['imagen_id'] ? (int) $p['imagen_id'] : null),
        'estado'      => $p['estado'],
    ];
    if ($admin) {
        $j += [
            'revision'           => $p['revision'],
            'comentarioRevision' => $p['comentario_revision'],
            'enviadoPor'         => $p['enviado_nombre'] ?? null,
            'enviadoPorId'       => $p['enviado_por'] !== null ? (int) $p['enviado_por'] : null,
            'creadoEn'           => $p['creado_en'],
            'destacado'          => es_destacado('proyecto', (int) $p['id']),
        ];
    }
    return $j;
}

function documento_json(array $d, bool $admin = false): array
{
    $j = [
        'id'          => (int) $d['id'],
        'titulo'      => $d['titulo'],
        'descripcion' => $d['descripcion'],
        'fecha'       => $d['fecha'],
        'url'         => url_archivo((int) $d['archivo_id']),
        'tamano'      => isset($d['tamano']) ? (int) $d['tamano'] : null,
        'semilleroId' => $d['semillero_id'] !== null ? (int) $d['semillero_id'] : null,
        'proyectoId'  => $d['proyecto_id'] !== null ? (int) $d['proyecto_id'] : null,
        'padre'       => $d['padre_nombre'] ?? null,
    ];
    if ($admin) {
        $j += [
            'revision'           => $d['revision'],
            'comentarioRevision' => $d['comentario_revision'],
            'enviadoPor'         => $d['enviado_nombre'] ?? null,
            'enviadoPorId'       => $d['enviado_por'] !== null ? (int) $d['enviado_por'] : null,
            'nombreOriginal'     => $d['nombre_original'] ?? null,
            'creadoEn'           => $d['creado_en'],
            'destacado'          => es_destacado('documento', (int) $d['id']),
        ];
    }
    return $j;
}

// Consultas base con los nombres relacionados
const SQL_PROYECTOS = 'SELECT p.*, s.nombre AS semillero_nombre, u.nombre AS enviado_nombre
    FROM proyectos p JOIN semilleros s ON s.id = p.semillero_id LEFT JOIN usuarios u ON u.id = p.enviado_por';

const SQL_DOCUMENTOS = 'SELECT d.*, a.tamano, a.nombre_original, u.nombre AS enviado_nombre,
        COALESCE(pr.titulo, s.nombre) AS padre_nombre, COALESCE(pr.semillero_id, d.semillero_id) AS semillero_efectivo
    FROM documentos d JOIN archivos a ON a.id = d.archivo_id
    LEFT JOIN proyectos pr ON pr.id = d.proyecto_id LEFT JOIN semilleros s ON s.id = d.semillero_id
    LEFT JOIN usuarios u ON u.id = d.enviado_por';
