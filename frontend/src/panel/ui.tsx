// Piezas de interfaz del panel, con la paleta institucional.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { api, mensajeDeError } from '../lib/api'

/** Carga datos de la API y permite recargarlos. */
export function useDatos<T>(ruta: string | null) {
  const [datos, setDatos] = useState<T | null>(null)
  const [error, setError] = useState('')
  const recargar = useCallback(() => {
    if (!ruta) return
    api.get<T>(ruta).then((d) => { setDatos(d); setError('') }).catch((e) => setError(mensajeDeError(e)))
  }, [ruta])
  useEffect(recargar, [recargar])
  return { datos, error, recargar }
}

export type Revision = 'pendiente' | 'aprobado' | 'rechazado'

export function ChipRevision({ revision }: { revision: Revision }) {
  const e = {
    pendiente: ['bg-accent-yellow text-foreground', 'Pendiente'],
    aprobado: ['bg-primary-soft text-primary-darker', 'Publicado'],
    rechazado: ['bg-danger-soft text-danger', 'Rechazado'],
  }[revision]
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${e[0]}`}>{e[1]}</span>
}

/** Campo de archivo con vista previa de la imagen o nombre del PDF actual. */
export function CampoArchivo({ nombre, etiqueta, tipo, actual, ayuda, requerido = false, onQuitar }: {
  nombre: string; etiqueta: string; tipo: 'imagen' | 'pdf'; actual?: string | null; ayuda?: string; requerido?: boolean; onQuitar?: (q: boolean) => void
}) {
  const [quitar, setQuitar] = useState(false)
  return (
    <div className="flex flex-col gap-1.5 text-sm font-semibold">
      <label htmlFor={`campo-${nombre}`}>{etiqueta}</label>
      {actual && !quitar && (
        tipo === 'imagen'
          ? <img src={actual} alt="Imagen actual" className="h-24 w-36 rounded-lg object-cover" />
          : <a href={actual} target="_blank" rel="noopener" className="font-normal text-primary-dark underline">Ver el PDF actual</a>
      )}
      <input
        id={`campo-${nombre}`}
        name={nombre}
        type="file"
        required={requerido}
        accept={tipo === 'pdf' ? 'application/pdf,.pdf' : 'image/jpeg,image/png,image/webp'}
        className="rounded-[10px] border-[1.5px] border-dashed border-primary bg-primary-soft/40 p-3 font-normal"
      />
      <span className="text-[13px] font-normal text-muted-text">
        {ayuda ?? (tipo === 'pdf' ? 'Solo PDF, máximo 20 MB.' : 'JPG, PNG o WebP, máximo 5 MB.')}
      </span>
      {actual && onQuitar && (
        <label className="flex items-center gap-2 font-normal">
          <input type="checkbox" checked={quitar} onChange={(e) => { setQuitar(e.target.checked); onQuitar(e.target.checked) }} /> Quitar la imagen actual
        </label>
      )}
    </div>
  )
}

/** Botón "eliminar" con confirmación. */
export function BotonEliminar({ etiqueta, confirmar, onEliminar }: { etiqueta: string; confirmar: string; onEliminar: () => Promise<void> }) {
  return (
    <button
      type="button"
      onClick={() => { if (window.confirm(confirmar)) void onEliminar() }}
      className="rounded-lg border-[1.5px] border-line px-3 py-2 text-sm font-semibold text-danger hover:border-danger"
      aria-label={etiqueta}
    >
      Eliminar
    </button>
  )
}

export const fechaCorta = (s: string | null) =>
  s ? new Date(s.length === 10 ? `${s}T12:00:00` : s.replace(' ', 'T')).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export function TituloPanel({ titulo, descripcion, acciones }: { titulo: string; descripcion?: string; acciones?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="con-barra text-3xl sm:text-4xl">{titulo}</h1>
        {descripcion && <p className="mt-3 max-w-2xl text-body">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  )
}

export function Campo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      {etiqueta}
      {children}
      {ayuda && <span className="text-[13px] font-normal text-muted-text">{ayuda}</span>}
    </label>
  )
}

export function Aviso({ tipo = 'error', children }: { tipo?: 'error' | 'ok' | 'info'; children: ReactNode }) {
  const estilos = {
    error: 'bg-danger-soft text-danger',
    ok: 'bg-primary-soft text-primary-darker',
    info: 'bg-sky-soft text-sky-text',
  }
  return (
    <p role={tipo === 'error' ? 'alert' : 'status'} className={`rounded-lg px-4 py-3 text-sm font-semibold ${estilos[tipo]}`}>
      {children}
    </p>
  )
}

export function Interruptor({ activo, onCambio, etiqueta }: { activo: boolean; onCambio: (v: boolean) => void; etiqueta: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={() => onCambio(!activo)}
      className="flex items-center gap-3 text-sm font-semibold"
    >
      <span className={`relative h-7 w-12 rounded-full transition-colors ${activo ? 'bg-primary-dark' : 'bg-[#C9C9C9]'}`}>
        <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${activo ? 'translate-x-6' : 'translate-x-1'}`} />
      </span>
      {etiqueta}
    </button>
  )
}

/** Ventana modal accesible (usa <dialog>: Esc cierra y el foco queda dentro). */
export function Modal({ abierto, titulo, onCerrar, children }: { abierto: boolean; titulo: string; onCerrar: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      aria-labelledby="modal-titulo"
      className="m-auto w-[min(560px,calc(100vw-2rem))] rounded-[var(--radius-card)] border-t-[6px] border-accent-yellow p-0 shadow-2xl backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
        <h2 id="modal-titulo" className="text-2xl">{titulo}</h2>
        <button type="button" onClick={onCerrar} aria-label="Cerrar" className="flex size-10 items-center justify-center rounded-lg hover:bg-muted">
          <X size={20} />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{abierto && children}</div>
    </dialog>
  )
}

export function Cargando() {
  return <p className="py-10 text-center text-muted-text" role="status">Cargando…</p>
}
