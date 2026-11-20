import { Play } from 'lucide-react'

// Se muestra cuando el sitio se abre con doble clic (file://) y el servidor local está apagado.
export default function AvisoSinServidor({ que = 'El portal' }: { que?: string }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3 rounded-[var(--radius-card)] border-t-[6px] border-accent-yellow bg-white p-7 shadow-[var(--shadow-card)]">
      <p className="flex items-center gap-2 font-display text-2xl">
        <Play className="text-primary-dark" aria-hidden="true" /> Enciende el servidor local
      </p>
      <p className="text-body">
        {que} necesita la base de datos. En la carpeta <strong>iecajete-web</strong>, haz doble clic en{' '}
        <strong className="rounded bg-yellow-soft px-1.5 py-0.5 font-mono">INICIAR-SITIO.bat</strong>: se abrirá el sitio completo
        en <strong>http://localhost:8000</strong>.
      </p>
      <p className="text-sm text-muted-text">Si ya lo encendiste, recarga esta página y te llevará allí automáticamente. En el hosting esto no hace falta.</p>
    </div>
  )
}
