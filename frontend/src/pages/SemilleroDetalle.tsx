import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, BookOpen, Download, FileText, Users } from 'lucide-react'
import CabeceraPagina from '../components/CabeceraPagina'
import { api, ErrorApi, mensajeDeError, SIN_SERVIDOR } from '../lib/api'
import NoEncontrada from './NoEncontrada'

type Documento = { id: number; titulo: string; descripcion: string | null; fecha: string | null; url: string; tamano: number | null }
type Proyecto = {
  id: number; titulo: string; resumen: string | null; integrantes: string[]; anio: number | null
  imagen: string | null; estado: 'en_curso' | 'finalizado'; documentos: Documento[]
}
type Detalle = {
  semillero: { nombre: string; descripcion: string | null; lider: string | null; imagen: string | null }
  proyectos: Proyecto[]
  documentos: Documento[]
}

const fecha = (s: string | null) => (s ? new Date(`${s}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '')
const peso = (b: number | null) => (b == null ? '' : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

export default function SemilleroDetalle() {
  const { slug } = useParams()
  const [d, setD] = useState<Detalle | null>(null)
  const [error, setError] = useState('')
  const [noExiste, setNoExiste] = useState(false)

  useEffect(() => {
    if (SIN_SERVIDOR) return
    api.get<Detalle>(`/publico/semilleros/${slug}`).then(setD).catch((e) => {
      if (e instanceof ErrorApi && e.estado === 404) setNoExiste(true)
      else setError(mensajeDeError(e))
    })
  }, [slug])

  if (noExiste) return <NoEncontrada />

  return (
    <>
      <CabeceraPagina antetitulo="Semillero de investigación" titulo={d?.semillero.nombre ?? 'Semillero'}>
        {d?.semillero.lider && <>Docente líder: <strong>{d.semillero.lider}</strong></>}
      </CabeceraPagina>
      <section className="contenedor py-12">
        <Link to="/semilleros" className="mb-8 inline-flex items-center gap-2 font-semibold text-primary-dark hover:underline">
          <ArrowLeft size={18} aria-hidden="true" /> Todos los semilleros
        </Link>
        {SIN_SERVIDOR && <p className="rounded-[var(--radius-card)] bg-sky-soft p-6 text-sky-text">Este contenido se carga desde el servidor.</p>}
        {error && <p role="alert" className="rounded-[var(--radius-card)] bg-danger-soft p-6 text-danger">{error}</p>}
        {!d && !error && !SIN_SERVIDOR && <p className="text-muted-text" role="status">Cargando…</p>}

        {d && (
          <>
            {(d.semillero.descripcion || d.semillero.imagen) && (
              <div className="mb-14 grid items-center gap-10 md:grid-cols-2">
                {d.semillero.descripcion && <p className="text-[17px] leading-relaxed whitespace-pre-line text-body">{d.semillero.descripcion}</p>}
                {d.semillero.imagen && <img src={d.semillero.imagen} alt={`Semillero ${d.semillero.nombre}`} className="w-full rounded-[var(--radius-card)] shadow-[14px_14px_0_var(--color-accent-yellow)]" />}
              </div>
            )}

            <h2 className="titulo-seccion mb-7">Proyectos</h2>
            {d.proyectos.length === 0 && <p className="mb-10 text-muted-text">Este semillero todavía no tiene proyectos publicados.</p>}
            <div className="mb-14 flex flex-col gap-6">
              {d.proyectos.map((p) => (
                <article key={p.id} className={`tarjeta grid overflow-hidden border-t-[6px] border-accent-yellow ${p.imagen ? 'md:grid-cols-[280px_1fr]' : ''}`}>
                  {p.imagen && <img src={p.imagen} alt="" loading="lazy" className="h-full max-h-64 w-full object-cover md:max-h-none" />}
                  <div className="flex flex-col gap-3 p-7">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`etiqueta ${p.estado === 'finalizado' ? 'bg-accent-sky' : 'bg-accent-yellow'}`}>{p.estado === 'finalizado' ? 'Finalizado' : 'En curso'}</span>
                      {p.anio && <span className="text-sm font-semibold text-muted-text">{p.anio}</span>}
                    </div>
                    <h3 className="font-display text-2xl">{p.titulo}</h3>
                    {p.resumen && <p className="leading-relaxed whitespace-pre-line text-body">{p.resumen}</p>}
                    {p.integrantes.length > 0 && (
                      <p className="flex items-start gap-2 text-sm text-body"><Users size={18} className="mt-0.5 shrink-0 text-primary-dark" aria-hidden="true" /><span><strong>Integrantes:</strong> {p.integrantes.join(', ')}</span></p>
                    )}
                    {p.documentos.length > 0 && <ListaPdf documentos={p.documentos} />}
                  </div>
                </article>
              ))}
            </div>

            {d.documentos.length > 0 && (
              <>
                <h2 className="titulo-seccion mb-7">Documentos del semillero</h2>
                <ListaPdf documentos={d.documentos} />
              </>
            )}
          </>
        )}
      </section>
    </>
  )
}

function ListaPdf({ documentos }: { documentos: Documento[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {documentos.map((doc) => (
        <li key={doc.id} className="flex flex-wrap items-center gap-4 rounded-[var(--radius-card)] border-2 border-[#EEE] bg-white p-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-yellow text-foreground"><FileText size={20} aria-hidden="true" /></span>
          <span className="flex min-w-0 flex-[1_1_220px] flex-col">
            <span className="font-semibold">{doc.titulo}</span>
            <span className="text-sm text-muted-text">{[fecha(doc.fecha), peso(doc.tamano)].filter(Boolean).join(' · ')}</span>
            {doc.descripcion && <span className="mt-1 text-sm text-body">{doc.descripcion}</span>}
          </span>
          <span className="flex flex-wrap gap-2">
            <a href={doc.url} target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-lg bg-primary-dark px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-darker">
              <BookOpen size={16} aria-hidden="true" /> Ver
            </a>
            <a href={`${doc.url}?descargar=1`} className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-primary-dark px-3.5 py-2 text-sm font-semibold text-primary-dark hover:bg-primary-soft">
              <Download size={16} aria-hidden="true" /> Descargar
            </a>
          </span>
        </li>
      ))}
    </ul>
  )
}
