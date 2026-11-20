// Piezas de interfaz del panel, con la paleta institucional.
import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

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
