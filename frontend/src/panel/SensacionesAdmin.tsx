import { useState, type FormEvent } from 'react'
import { BookOpenText, Pencil, Plus } from 'lucide-react'
import { api, mensajeDeError } from '../lib/api'
import { Aviso, BotonEliminar, Campo, CampoArchivo, Cargando, fechaCorta, Interruptor, Modal, TituloPanel, useDatos } from './ui'
import InterruptorDestacado from './InterruptorDestacado'

export type EdicionAdmin = {
  id: number
  numero: number
  titulo: string
  fecha: string
  descripcion: string | null
  portada: string | null
  pdf: string | null
  publicada: boolean
  destacado: boolean
}

export default function SensacionesAdmin() {
  const { datos, error, recargar } = useDatos<{ ediciones: EdicionAdmin[] }>('/admin/ediciones')
  const [editando, setEditando] = useState<EdicionAdmin | 'nueva' | null>(null)
  const [aviso, setAviso] = useState('')
  const siguiente = Math.max(0, ...(datos?.ediciones.map((e) => e.numero) ?? [0])) + 1

  return (
    <>
      <TituloPanel
        titulo="Sensaciones"
        descripcion="Ediciones del magazine escolar. Se muestran en el sitio de la más reciente a la más antigua, con visor y descarga del PDF."
        acciones={<button type="button" className="btn-primario" onClick={() => setEditando('nueva')}><Plus size={18} aria-hidden="true" /> Nueva edición</button>}
      />
      {(error || aviso) && <div className="mb-5"><Aviso>{error || aviso}</Aviso></div>}
      {!datos && !error && <Cargando />}
      <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 xl:grid-cols-5">
        {datos?.ediciones.map((e) => (
          <li key={e.id} className={`flex flex-col gap-2 ${e.publicada ? '' : 'opacity-70'}`}>
            {e.portada ? (
              <img src={e.portada} alt={`Portada de ${e.titulo}`} className="aspect-[744/1024] w-full rounded-[var(--radius-card)] object-cover shadow-[var(--shadow-soft)]" />
            ) : (
              <span className="flex aspect-[744/1024] w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border-t-8 border-accent-yellow bg-primary-dark text-white">
                <BookOpenText size={32} aria-hidden="true" />
                <span className="font-display text-3xl text-accent-yellow">N.º {e.numero}</span>
              </span>
            )}
            <span className="font-semibold">N.º {e.numero} · {e.titulo}</span>
            <span className="-mt-1.5 text-sm text-muted-text">{fechaCorta(e.fecha)}{!e.publicada && ' · Borrador'}</span>
            {e.publicada && <span><InterruptorDestacado tipo="edicion" id={e.id} activo={e.destacado} /></span>}
            <span className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setEditando(e)} className="flex items-center gap-1 rounded-lg border-[1.5px] border-line px-2.5 py-1.5 text-sm font-semibold hover:border-primary-dark" aria-label={`Editar ${e.titulo}`}>
                <Pencil size={14} aria-hidden="true" /> Editar
              </button>
              <BotonEliminar
                etiqueta={`Eliminar ${e.titulo}`}
                confirmar={`¿Eliminar la edición N.º ${e.numero}? Se borran su PDF y su portada.`}
                onEliminar={async () => { try { await api.delete(`/ediciones/${e.id}`); recargar() } catch (err) { setAviso(mensajeDeError(err)) } }}
              />
            </span>
          </li>
        ))}
      </ul>
      <Modal abierto={!!editando} titulo={editando === 'nueva' ? 'Nueva edición' : 'Editar edición'} onCerrar={() => setEditando(null)}>
        {editando && <FormularioEdicion edicion={editando === 'nueva' ? null : editando} siguiente={siguiente} onGuardado={() => { setEditando(null); recargar() }} />}
      </Modal>
    </>
  )
}

function FormularioEdicion({ edicion, siguiente, onGuardado }: { edicion: EdicionAdmin | null; siguiente: number; onGuardado: () => void }) {
  const [publicada, setPublicada] = useState(edicion?.publicada ?? true)
  const [quitarPortada, setQuitarPortada] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('publicada', publicada ? '1' : '0')
    if (quitarPortada) fd.set('quitar_portada', '1')
    setEnviando(true)
    setError('')
    try {
      await api.post(edicion ? `/ediciones/${edicion.id}` : '/ediciones', fd)
      onGuardado()
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
        <Campo etiqueta="Número">
          <input name="numero" type="number" min={1} required defaultValue={edicion?.numero ?? siguiente} className="campo" />
        </Campo>
        <Campo etiqueta="Título">
          <input name="titulo" required maxLength={150} defaultValue={edicion?.titulo ?? ''} placeholder="Ej.: Cuarta edición" className="campo" />
        </Campo>
      </div>
      <Campo etiqueta="Fecha de publicación">
        <input name="fecha" type="date" required defaultValue={edicion?.fecha ?? new Date().toISOString().slice(0, 10)} className="campo" />
      </Campo>
      <Campo etiqueta="Descripción" ayuda="Tema central y artículos principales.">
        <textarea name="descripcion" rows={4} maxLength={5000} defaultValue={edicion?.descripcion ?? ''} className="campo resize-y" />
      </Campo>
      <CampoArchivo nombre="portada" etiqueta="Portada (imagen)" tipo="imagen" actual={edicion?.portada} onQuitar={setQuitarPortada} />
      <CampoArchivo nombre="pdf" etiqueta={edicion ? 'Reemplazar el PDF de la revista (opcional)' : 'PDF de la revista'} tipo="pdf" actual={edicion?.pdf} requerido={!edicion} />
      <Interruptor activo={publicada} onCambio={setPublicada} etiqueta={publicada ? 'Publicada: visible en el sitio' : 'Borrador: oculta en el sitio'} />
      {error && <Aviso>{error}</Aviso>}
      <button type="submit" disabled={enviando} className="btn-primario self-start disabled:opacity-60">{enviando ? 'Subiendo…' : 'Guardar edición'}</button>
    </form>
  )
}
