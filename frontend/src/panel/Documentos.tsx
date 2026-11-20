import { useState } from 'react'
import { FileText, Pencil, Upload } from 'lucide-react'
import { api, mensajeDeError } from '../lib/api'
import { Aviso, BotonEliminar, Cargando, ChipRevision, fechaCorta, Modal, TituloPanel, useDatos } from './ui'
import { tamanoLegible, type DocumentoAdmin, type ProyectoAdmin, type SemilleroAdmin } from './tipos'
import FormularioDocumento from './FormularioDocumento'
import InterruptorDestacado from './InterruptorDestacado'

export default function Documentos() {
  const { datos, error, recargar } = useDatos<{ documentos: DocumentoAdmin[] }>('/admin/documentos')
  const { datos: sem } = useDatos<{ semilleros: SemilleroAdmin[] }>('/admin/semilleros')
  const { datos: pro } = useDatos<{ proyectos: ProyectoAdmin[] }>('/admin/proyectos')
  const [editando, setEditando] = useState<DocumentoAdmin | 'nuevo' | null>(null)
  const [aviso, setAviso] = useState('')
  const semilleros = sem?.semilleros ?? []

  return (
    <>
      <TituloPanel
        titulo="Documentos"
        descripcion="PDFs de los semilleros y proyectos: informes, artículos y pósters. Se pueden ver en el navegador o descargar desde el sitio."
        acciones={<button type="button" className="btn-primario" disabled={!semilleros.length} onClick={() => setEditando('nuevo')}><Upload size={18} aria-hidden="true" /> Subir PDF</button>}
      />
      {(error || aviso) && <div className="mb-5"><Aviso>{error || aviso}</Aviso></div>}
      {!datos && !error && <Cargando />}
      {datos && datos.documentos.length === 0 && <p className="rounded-[var(--radius-card)] border-2 border-dashed border-line bg-white p-8 text-center text-muted-text">Todavía no hay PDFs.</p>}
      <ul className="flex flex-col gap-3">
        {datos?.documentos.map((d) => (
          <li key={d.id} className="tarjeta flex flex-wrap items-center gap-4 p-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-dark"><FileText size={22} aria-hidden="true" /></span>
            <div className="flex min-w-0 flex-[1_1_260px] flex-col">
              <a href={d.url} target="_blank" rel="noopener" className="font-semibold hover:text-primary-dark hover:underline">{d.titulo}</a>
              <span className="text-sm text-muted-text">
                {d.padre} · {fechaCorta(d.fecha)} · {tamanoLegible(d.tamano)}{d.enviadoPor && ` · ${d.enviadoPor}`}
              </span>
            </div>
            <ChipRevision revision={d.revision} />
            {d.revision === 'aprobado' && <InterruptorDestacado tipo="documento" id={d.id} activo={d.destacado} />}
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditando(d)} className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-line px-3 py-2 text-sm font-semibold hover:border-primary-dark" aria-label={`Editar ${d.titulo}`}>
                <Pencil size={15} aria-hidden="true" /> Editar
              </button>
              <BotonEliminar
                etiqueta={`Eliminar ${d.titulo}`}
                confirmar={`¿Eliminar el PDF "${d.titulo}"?`}
                onEliminar={async () => { try { await api.delete(`/documentos/${d.id}`); recargar() } catch (e) { setAviso(mensajeDeError(e)) } }}
              />
            </div>
          </li>
        ))}
      </ul>
      <Modal abierto={!!editando} titulo={editando === 'nuevo' ? 'Subir PDF' : 'Editar PDF'} onCerrar={() => setEditando(null)}>
        {editando && (
          <FormularioDocumento
            documento={editando === 'nuevo' ? null : editando}
            semilleros={semilleros}
            proyectos={(pro?.proyectos ?? []).map((p) => ({ id: p.id, titulo: p.titulo, semilleroId: p.semilleroId }))}
            onGuardado={() => { setEditando(null); recargar() }}
          />
        )}
      </Modal>
    </>
  )
}
