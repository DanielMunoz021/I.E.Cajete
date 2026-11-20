import { useEffect, useRef } from 'react'
import { Download, ExternalLink, X } from 'lucide-react'

// Visor de PDF dentro del sitio (usa el visor del navegador). Esc lo cierra.
export default function VisorPdf({ url, titulo, onCerrar }: { url: string | null; titulo: string; onCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (url && !d.open) d.showModal()
    if (!url && d.open) d.close()
  }, [url])

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      aria-label={`Leer ${titulo}`}
      className="m-auto h-[92vh] w-[min(1100px,96vw)] overflow-hidden rounded-[var(--radius-card)] border-t-[6px] border-accent-yellow p-0 backdrop:bg-black/60"
    >
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
          <h2 className="font-display text-xl">{titulo}</h2>
          <div className="flex items-center gap-2">
            {url && (
              <>
                <a href={url} target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-line px-3 py-2 text-sm font-semibold hover:border-primary-dark">
                  <ExternalLink size={15} aria-hidden="true" /> Pestaña nueva
                </a>
                <a href={url.startsWith('api/') ? `${url}?descargar=1` : url} download className="flex items-center gap-1.5 rounded-lg bg-accent-yellow px-3 py-2 text-sm font-semibold text-foreground">
                  <Download size={15} aria-hidden="true" /> Descargar
                </a>
              </>
            )}
            <button type="button" onClick={onCerrar} aria-label="Cerrar el visor" className="flex size-10 items-center justify-center rounded-lg hover:bg-muted">
              <X size={20} />
            </button>
          </div>
        </div>
        {url && <iframe src={url} title={titulo} className="w-full flex-1 border-0 bg-muted" />}
      </div>
    </dialog>
  )
}
