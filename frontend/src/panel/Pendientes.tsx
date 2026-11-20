import { useState, type FormEvent } from 'react'
import { Check, FileText, FolderKanban, Inbox, X } from 'lucide-react'
import { api, mensajeDeError } from '../lib/api'
import { Aviso, Campo, Cargando, fechaCorta, Modal, TituloPanel, useDatos } from './ui'
import { tamanoLegible, type DocumentoAdmin, type ProyectoAdmin } from './tipos'

type Datos = { proyectos: ProyectoAdmin[]; documentos: (DocumentoAdmin & { proyectoPendiente: boolean })[] }
type Rechazo = { tipo: 'proyecto' | 'documento'; id: number; titulo: string }

export default function Pendientes() {
  const { datos, error, recargar } = useDatos<Datos>('/pendientes')
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [rechazando, setRechazando] = useState<Rechazo | null>(null)

  const aprobar = async (tipo: 'proyecto' | 'documento', id: number, titulo: string) => {
    try {
      await api.post(`/revision/${tipo}/${id}/aprobar`)
      setAviso({ tipo: 'ok', texto: `"${titulo}" quedó publicado.` })
      recargar()
    } catch (e) {
      setAviso({ tipo: 'error', texto: mensajeDeError(e) })
    }
  }

  const total = (datos?.proyectos.length ?? 0) + (datos?.documentos.length ?? 0)

  return (
    <>
      <TituloPanel titulo="Pendientes" descripcion="Proyectos y PDFs que enviaron los docentes. Nada se publica sin tu aprobación; si rechazas, el docente verá tu comentario y podrá corregir." />
      {aviso && <div className="mb-5"><Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso></div>}
      {error && <div className="mb-5"><Aviso>{error}</Aviso></div>}
      {!datos && !error && <Cargando />}
      {datos && total === 0 && (
        <p className="flex items-center gap-3 rounded-[var(--radius-card)] border-2 border-dashed border-line bg-white p-8 text-muted-text"><Inbox aria-hidden="true" /> No hay nada pendiente por revisar.</p>
      )}

      <div className="flex flex-col gap-4">
        {datos?.proyectos.map((p) => (
          <article key={`p${p.id}`} className="tarjeta flex flex-wrap gap-5 border-l-0 border-t-[6px] border-accent-yellow p-6">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-dark text-white"><FolderKanban size={22} aria-hidden="true" /></span>
            <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1.5">
              <span className="text-xs font-bold tracking-wide text-primary-dark uppercase">Proyecto propuesto · {p.semillero}</span>
              <h2 className="font-display text-2xl">{p.titulo}</h2>
              <p className="text-sm text-muted-text">Enviado por {p.enviadoPor ?? '—'} · {fechaCorta(p.creadoEn)}{p.anio && ` · Año ${p.anio}`}</p>
              {p.resumen && <p className="mt-1 whitespace-pre-line text-body">{p.resumen}</p>}
              {p.integrantes.length > 0 && <p className="text-sm text-body"><strong>Integrantes:</strong> {p.integrantes.join(', ')}</p>}
              {p.imagen && <img src={p.imagen} alt="" className="mt-2 h-32 w-48 rounded-lg object-cover" />}
            </div>
            <Acciones onAprobar={() => void aprobar('proyecto', p.id, p.titulo)} onRechazar={() => setRechazando({ tipo: 'proyecto', id: p.id, titulo: p.titulo })} />
          </article>
        ))}
        {datos?.documentos.map((d) => (
          <article key={`d${d.id}`} className="tarjeta flex flex-wrap gap-5 border-t-[6px] border-accent-yellow p-6">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent-yellow"><FileText size={22} aria-hidden="true" /></span>
            <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1.5">
              <span className="text-xs font-bold tracking-wide text-primary-dark uppercase">PDF · {d.padre}</span>
              <h2 className="font-display text-2xl">{d.titulo}</h2>
              <p className="text-sm text-muted-text">Enviado por {d.enviadoPor ?? '—'} · {fechaCorta(d.creadoEn)} · {tamanoLegible(d.tamano)}</p>
              {d.descripcion && <p className="mt-1 text-body">{d.descripcion}</p>}
              <a href={d.url} target="_blank" rel="noopener" className="mt-1 self-start font-semibold text-primary-dark underline">Abrir el PDF para revisarlo</a>
              {d.proyectoPendiente && <Aviso tipo="info">Su proyecto todavía está pendiente: apruébalo primero.</Aviso>}
            </div>
            <Acciones deshabilitarAprobar={d.proyectoPendiente} onAprobar={() => void aprobar('documento', d.id, d.titulo)} onRechazar={() => setRechazando({ tipo: 'documento', id: d.id, titulo: d.titulo })} />
          </article>
        ))}
      </div>

      <Modal abierto={!!rechazando} titulo="Rechazar envío" onCerrar={() => setRechazando(null)}>
        {rechazando && (
          <FormularioRechazo
            envio={rechazando}
            onListo={(titulo) => { setRechazando(null); setAviso({ tipo: 'ok', texto: `"${titulo}" fue rechazado. El docente verá tu comentario.` }); recargar() }}
          />
        )}
      </Modal>
    </>
  )
}

function Acciones({ onAprobar, onRechazar, deshabilitarAprobar = false }: { onAprobar: () => void; onRechazar: () => void; deshabilitarAprobar?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <button type="button" onClick={onRechazar} className="flex items-center gap-1.5 rounded-xl border-[1.5px] border-danger px-4 py-2.5 font-semibold text-danger hover:bg-danger-soft">
        <X size={18} aria-hidden="true" /> Rechazar
      </button>
      <button type="button" onClick={onAprobar} disabled={deshabilitarAprobar} className="btn-primario disabled:opacity-50">
        <Check size={18} aria-hidden="true" /> Aprobar
      </button>
    </div>
  )
}

function FormularioRechazo({ envio, onListo }: { envio: Rechazo; onListo: (titulo: string) => void }) {
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState('')
  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await api.post(`/revision/${envio.tipo}/${envio.id}/rechazar`, { comentario })
      onListo(envio.titulo)
    } catch (err) {
      setError(mensajeDeError(err))
    }
  }
  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <p className="text-body">Vas a rechazar <strong>{envio.titulo}</strong>.</p>
      <Campo etiqueta="Comentario para el docente" ayuda="Explica qué debe corregir. Lo verá en «Mis envíos».">
        <textarea required rows={4} maxLength={2000} value={comentario} onChange={(e) => setComentario(e.target.value)} className="campo resize-y" />
      </Campo>
      {error && <Aviso>{error}</Aviso>}
      <button type="submit" className="flex items-center gap-1.5 self-start rounded-xl bg-danger px-5 py-3 font-semibold text-white">
        <X size={18} aria-hidden="true" /> Rechazar con este comentario
      </button>
    </form>
  )
}
