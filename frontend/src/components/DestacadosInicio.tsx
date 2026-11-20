import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, FileText, Star } from 'lucide-react'
import { api, SIN_SERVIDOR } from '../lib/api'

type Destacado = {
  id: number
  tipo: 'semillero' | 'proyecto' | 'documento' | 'edicion'
  etiqueta: string
  titulo: string
  descripcion: string | null
  imagen: string | null
  enlace: string
  externo: boolean
}

// Sección "Destacados" del inicio: se arma con lo que el admin marca en el panel.
// No se muestra si no hay destacados (ni cuando el sitio se abre sin servidor).
export default function DestacadosInicio() {
  const [lista, setLista] = useState<Destacado[]>([])

  useEffect(() => {
    if (SIN_SERVIDOR) return
    api.get<{ destacados: Destacado[] }>('/publico/destacados').then((r) => setLista(r.destacados)).catch(() => setLista([]))
  }, [])

  if (lista.length === 0) return null

  return (
    <section className="contenedor mt-22" aria-labelledby="titulo-destacados">
      <div className="mb-7 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-accent-yellow"><Star size={22} fill="currentColor" aria-hidden="true" /></span>
        <h2 id="titulo-destacados" className="titulo-seccion">Destacados</h2>
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((d, i) => {
          const contenido = (
            <>
              {d.imagen ? (
                <img src={d.imagen} alt="" loading="lazy" className="h-48 w-full object-cover" />
              ) : (
                <span className={`flex h-48 items-center justify-center ${i % 2 ? 'bg-yellow-soft' : 'bg-primary-soft text-primary-dark'}`}>
                  <FileText size={48} aria-hidden="true" />
                </span>
              )}
              <span className={`h-1.5 ${i % 2 ? 'bg-primary' : 'bg-accent-yellow'}`} aria-hidden="true" />
              <span className="flex flex-1 flex-col gap-2 p-6">
                <span className="text-xs font-bold tracking-wide text-primary-dark uppercase">{d.etiqueta}</span>
                <span className="font-display text-xl group-hover:text-primary-dark">{d.titulo}</span>
                {d.descripcion && <span className="line-clamp-3 text-[15px] text-body">{d.descripcion}</span>}
                <span className="mt-auto flex items-center gap-1.5 pt-2 font-semibold text-primary-dark">
                  {d.externo ? 'Ver PDF' : 'Ver más'} <ArrowRight size={16} aria-hidden="true" />
                </span>
              </span>
            </>
          )
          const clase = 'tarjeta group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-[0_14px_34px_rgb(0_122_82/0.2)]'
          return (
            <li key={d.id}>
              {d.externo ? (
                <a href={d.enlace} target="_blank" rel="noopener" className={clase}>{contenido}</a>
              ) : (
                <Link to={`/${d.enlace}`} className={clase}>{contenido}</Link>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
