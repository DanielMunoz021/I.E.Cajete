import { useState } from 'react'
import { FileText, FolderKanban, Pencil } from 'lucide-react'
import { api, mensajeDeError } from '../lib/api'
import { Aviso, BotonEliminar, Cargando, ChipRevision, fechaCorta, Modal, TituloPanel, useDatos, type Revision } from './ui'
import type { DocumentoAdmin, ProyectoAdmin } from './tipos'
import FormularioProyecto from './FormularioProyecto'
import FormularioDocumento from './FormularioDocumento'

type MiSemillero = { id: number; nombre: string; proyectos: { id: number; titulo: string; semilleroId: number }[] }

// Vista del docente: el estado de cada envío y el comentario si fue rechazado.
export default function MisEnvios() {
  const { datos, error, recargar } = useDatos<{ proyectos: ProyectoAdmin[]; documentos: DocumentoAdmin[] }>('/mis/envios')
  const { datos: sem } = useDatos<{ semilleros: MiSemillero[] }>('/mis/semilleros')
  const [editando, setEditando] = useState<{ p?: ProyectoAdmin; d?: DocumentoAdmin } | null>(null)
  const [aviso, setAviso] = useState('')
  const semilleros = sem?.semilleros ?? []

  type Fila = { clave: string; tipo: 'Proyecto' | 'PDF'; titulo: string; lugar: string; fecha: string; revision: Revision; comentario: string | null; p?: ProyectoAdmin; d?: DocumentoAdmin }
  const filas: Fila[] = [
    ...(datos?.proyectos ?? []).map((p) => ({ clave: `p${p.id}`, tipo: 'Proyecto' as const, titulo: p.titulo, lugar: p.semillero, fecha: p.creadoEn, revision: p.revision, comentario: p.comentarioRevision, p })),
    ...(datos?.documentos ?? []).map((d) => ({ clave: `d${d.id}`, tipo: 'PDF' as const, titulo: d.titulo, lugar: d.padre ?? '', fecha: d.creadoEn, revision: d.revision, comentario: d.comentarioRevision, d })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha))

  const eliminar = async (f: Fila) => {
    try {
      await api.delete(f.p ? `/proyectos/${f.p.id}` : `/documentos/${f.d!.id}`)
      recargar()
    } catch (e) {
      setAviso(mensajeDeError(e))
    }
  }

  return (
    <>
      <TituloPanel titulo="Mis envíos" descripcion="El estado de lo que has enviado. Si algo fue rechazado, lee el comentario, corrígelo y vuelve a enviarlo." />
      {(error || aviso) && <div className="mb-5"><Aviso>{error || aviso}</Aviso></div>}
      {!datos && !error && <Cargando />}
      {datos && filas.length === 0 && <p className="rounded-[var(--radius-card)] border-2 border-dashed border-line bg-white p-8 text-muted-text">Todavía no has enviado nada. Empieza en «Mis semilleros».</p>}
      <ul className="flex flex-col gap-3">
        {filas.map((f) => (
          <li key={f.clave} className="tarjeta flex flex-wrap items-start gap-4 p-5">
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${f.tipo === 'PDF' ? 'bg-accent-yellow' : 'bg-primary-dark text-white'}`}>
              {f.tipo === 'PDF' ? <FileText size={20} aria-hidden="true" /> : <FolderKanban size={20} aria-hidden="true" />}
            </span>
            <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
              <span className="font-semibold">{f.titulo}</span>
              <span className="text-sm text-muted-text">{f.tipo} · {f.lugar} · {fechaCorta(f.fecha)}</span>
              {f.revision === 'rechazado' && f.comentario && (
                <p className="mt-1 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"><strong>Comentario de la administración:</strong> {f.comentario}</p>
              )}
            </div>
            <ChipRevision revision={f.revision} />
            {f.revision !== 'aprobado' && (
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditando({ p: f.p, d: f.d })} className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-line px-3 py-2 text-sm font-semibold hover:border-primary-dark">
                  <Pencil size={15} aria-hidden="true" /> {f.revision === 'rechazado' ? 'Corregir' : 'Editar'}
                </button>
                <BotonEliminar etiqueta={`Eliminar ${f.titulo}`} confirmar={`¿Eliminar "${f.titulo}"?`} onEliminar={() => eliminar(f)} />
              </div>
            )}
          </li>
        ))}
      </ul>
      <Modal abierto={!!editando} titulo={editando?.p ? 'Editar proyecto' : 'Editar PDF'} onCerrar={() => setEditando(null)}>
        {editando?.p && <FormularioProyecto proyecto={editando.p} semilleros={semilleros} textoBoton="Enviar a revisión" onGuardado={() => { setEditando(null); recargar() }} />}
        {editando?.d && (
          <FormularioDocumento
            documento={editando.d}
            semilleros={semilleros}
            proyectos={semilleros.flatMap((s) => s.proyectos)}
            textoBoton="Enviar a revisión"
            onGuardado={() => { setEditando(null); recargar() }}
          />
        )}
      </Modal>
    </>
  )
}
