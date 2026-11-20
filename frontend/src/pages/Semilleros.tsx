import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, FileText, FolderKanban, Sprout } from 'lucide-react'
import CabeceraPagina from '../components/CabeceraPagina'
import { api, mensajeDeError, SIN_SERVIDOR } from '../lib/api'

export type SemilleroPublico = {
  id: number
  nombre: string
  slug: string
  descripcion: string | null
  lider: string | null
  imagen: string | null
  proyectos: number
  documentos: number
}

export default function Semilleros() {
  const [lista, setLista] = useState<SemilleroPublico[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (SIN_SERVIDOR) return
    api.get<{ semilleros: SemilleroPublico[] }>('/publico/semilleros').then((r) => setLista(r.semilleros)).catch((e) => setError(mensajeDeError(e)))
  }, [])

  return (
    <>
      <CabeceraPagina antetitulo="Investigación" titulo="Semilleros">
        Los semilleros de investigación de la institución: sus proyectos y los trabajos que han producido docentes y estudiantes.
      </CabeceraPagina>
      <section className="contenedor py-14">
        {SIN_SERVIDOR && <p className="rounded-[var(--radius-card)] bg-sky-soft p-6 text-sky-text">Los semilleros se cargan desde el servidor: ábrelos en el sitio publicado o con el servidor local.</p>}
        {error && <p role="alert" className="rounded-[var(--radius-card)] bg-danger-soft p-6 text-danger">{error}</p>}
        {!lista && !error && !SIN_SERVIDOR && <p className="text-muted-text" role="status">Cargando semilleros…</p>}
        {lista?.length === 0 && <p className="text-muted-text">Pronto publicaremos aquí los semilleros de investigación.</p>}
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lista?.map((s, i) => (
            <li key={s.id}>
              <Link to={`/semilleros/${s.slug}`} className="tarjeta group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-[0_14px_34px_rgb(0_122_82/0.2)]">
                {s.imagen ? (
                  <img src={s.imagen} alt="" loading="lazy" className="h-44 w-full object-cover" />
                ) : (
                  <span className={`flex h-44 items-center justify-center ${i % 2 ? 'bg-yellow-soft text-foreground' : 'bg-primary-soft text-primary-dark'}`}><Sprout size={48} aria-hidden="true" /></span>
                )}
                <span className={`h-1.5 ${i % 2 ? 'bg-accent-yellow' : 'bg-primary'}`} aria-hidden="true" />
                <span className="flex flex-1 flex-col gap-2 p-6">
                  <span className="font-display text-2xl group-hover:text-primary-dark">{s.nombre}</span>
                  {s.descripcion && <span className="line-clamp-3 text-body">{s.descripcion}</span>}
                  {s.lider && <span className="text-sm text-muted-text">Líder: {s.lider}</span>}
                  <span className="mt-auto flex flex-wrap items-center gap-4 pt-3 text-sm font-semibold text-primary-dark">
                    <span className="flex items-center gap-1.5"><FolderKanban size={16} aria-hidden="true" /> {s.proyectos} proyecto{s.proyectos === 1 ? '' : 's'}</span>
                    <span className="flex items-center gap-1.5"><FileText size={16} aria-hidden="true" /> {s.documentos} PDF</span>
                    <ArrowRight size={18} className="ml-auto" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
