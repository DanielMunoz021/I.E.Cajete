import { useEffect, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { FOTOS_PORTADA } from '../data/institucional'

const INTERVALO_MS = 6000

const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Fondo de la portada: las fotos del carrusel del sitio actual, con fundido.
// Se puede pausar (WCAG 2.2.2) y no avanza solo si el usuario pidió menos movimiento.
export default function CarruselPortada() {
  const [actual, setActual] = useState(0)
  const [pausado, setPausado] = useState(sinMovimiento)

  useEffect(() => {
    if (pausado) return
    const id = window.setInterval(() => {
      if (!sinMovimiento()) setActual((i) => (i + 1) % FOTOS_PORTADA.length)
    }, INTERVALO_MS)
    return () => window.clearInterval(id)
  }, [pausado])

  return (
    <>
      {FOTOS_PORTADA.map((f, i) => (
        <img
          key={f.src}
          src={f.src}
          alt={i === actual ? f.alt : ''}
          aria-hidden={i !== actual}
          width={f.ancho}
          height={f.alto}
          fetchPriority={i === 0 ? 'high' : 'low'}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-700 motion-reduce:transition-none ${i === actual ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/80 via-primary/40 to-transparent" aria-hidden="true" />
      <div className="absolute right-4 bottom-24 z-10 flex items-center gap-2 rounded-full bg-black/40 px-3 py-2 sm:right-6">
        {FOTOS_PORTADA.map((f, i) => (
          <button
            key={f.src}
            type="button"
            aria-label={`Ver foto ${i + 1} de ${FOTOS_PORTADA.length}`}
            aria-current={i === actual}
            onClick={() => setActual(i)}
            className={`size-3 rounded-full border-2 border-white transition-colors ${i === actual ? 'bg-accent-yellow' : 'bg-transparent'}`}
          />
        ))}
        <button
          type="button"
          aria-label={pausado ? 'Reanudar el carrusel' : 'Pausar el carrusel'}
          aria-pressed={pausado}
          onClick={() => setPausado((p) => !p)}
          className="ml-1 flex size-7 items-center justify-center rounded-full bg-white text-foreground"
        >
          {pausado ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
        </button>
      </div>
    </>
  )
}
