import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowRight, FileText, MapPin, School, User } from 'lucide-react'
import CabeceraPagina from '../components/CabeceraPagina'
import NoEncontrada from './NoEncontrada'
import { INSTITUCION, MENU } from '../data/sitio'
import {
  DIRECTIVOS, DOCENTES, ESCUELA_PADRES, FUNDACION, MANUAL, MISION, OBJETIVOS, OTRAS_SEDES,
  PEI_LEMA, PEI_PDF, RESENA, SEDE_CENTRAL, VISION,
} from '../data/institucional'

type Seccion = { titulo: string; antetitulo: string; intro?: string; cuerpo: () => ReactNode }

const SECCIONES: Record<string, Seccion> = {
  'mision-vision': {
    titulo: 'Misión y visión',
    antetitulo: 'Institucional',
    cuerpo: () => (
      <>
        <div className="grid gap-6 md:grid-cols-2">
          <article className="tarjeta border-t-[6px] border-primary p-8">
            <h2 className="con-barra text-3xl">Misión</h2>
            <p className="mt-4 text-[17px] leading-relaxed text-body">{MISION}</p>
          </article>
          <article className="tarjeta border-t-[6px] border-accent-yellow p-8">
            <h2 className="con-barra text-3xl">Visión</h2>
            <p className="mt-4 text-[17px] text-body">{VISION.intro}</p>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-[17px] leading-relaxed text-body">
              {VISION.puntos.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </article>
        </div>
        <h2 className="titulo-seccion mt-14 mb-6">Objetivos institucionales</h2>
        <ol className="grid gap-4 md:grid-cols-2">
          {OBJETIVOS.map((o, i) => (
            <li key={o} className="flex gap-4 rounded-[var(--radius-card)] bg-muted p-5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-yellow font-bold">{i + 1}</span>
              <span className="leading-relaxed text-body">{o}</span>
            </li>
          ))}
        </ol>
      </>
    ),
  },
  simbolos: {
    titulo: 'Símbolos institucionales',
    antetitulo: 'Institucional',
    intro: 'Escudo, bandera e himno.',
    cuerpo: () => (
      <div className="grid gap-6 md:grid-cols-3">
        <article className="tarjeta flex flex-col items-center gap-4 p-8 text-center">
          <img src="img/escudo.png" alt="Escudo de la Institución Educativa Cajete" width={318} height={312} className="w-48" />
          <h2 className="text-2xl">Escudo</h2>
          <p className="text-body">En el libro del escudo se lee el lema: <strong>{INSTITUCION.lema}</strong>.</p>
        </article>
        <article className="tarjeta flex flex-col gap-3 p-8">
          <h2 className="text-2xl">Bandera</h2>
          <p className="text-body"><span className="validar">[VALIDAR]</span> Imagen y descripción de la bandera.</p>
        </article>
        <article className="tarjeta flex flex-col gap-3 p-8">
          <h2 className="text-2xl">Himno</h2>
          <p className="text-body"><span className="validar">[VALIDAR]</span> Letra del himno y autores.</p>
        </article>
      </div>
    ),
  },
  resena: {
    titulo: 'Reseña histórica',
    antetitulo: 'Institucional',
    intro: `Desde ${FUNDACION}, formando a la comunidad de Cajete.`,
    cuerpo: () => (
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div className="space-y-4 text-[17px] leading-relaxed text-body">
          {RESENA.map((p) => <p key={p}>{p}</p>)}
        </div>
        <img src="img/sede-cajete.jpg" alt="Estudiantes con trajes típicos frente a la sede principal" width={800} height={424} loading="lazy" className="w-full rounded-[var(--radius-card)] shadow-[14px_14px_0_var(--color-accent-yellow)]" />
      </div>
    ),
  },
  sedes: {
    titulo: 'Sedes',
    antetitulo: 'Institución Educativa Cajete',
    intro: 'Una institución educativa con enfoque rural.',
    cuerpo: () => (
      <>
        <div className="grid items-start gap-8 md:grid-cols-[3fr_2fr]">
          <figure>
            <img src="img/sede-dibujo.jpg" alt="Dibujo de la sede central con estudiantes en primer plano" width={1200} height={848} loading="lazy" className="w-full rounded-[var(--radius-card)] shadow-[var(--shadow-card)]" />
            <figcaption className="mt-2 text-sm text-muted-text">Dibujo crítico de Milton Meneses · Grupo editorial Sensaciones</figcaption>
          </figure>
          <div className="flex flex-col gap-4">
            <span className="etiqueta self-start bg-accent-yellow">Sede principal</span>
            <h2 className="text-3xl">{SEDE_CENTRAL.nombre}</h2>
            <p className="text-[17px] text-body">{SEDE_CENTRAL.descripcion}</p>
            <p className="flex items-start gap-2 text-body"><MapPin size={20} className="mt-0.5 shrink-0 text-primary-dark" aria-hidden="true" />{INSTITUCION.direccion}, Popayán</p>
            <img src="img/hero-sede.jpg" alt="Pasillos y salones de la sede central" width={1536} height={1152} loading="lazy" className="aspect-[16/10] w-full rounded-[var(--radius-card)] object-cover" />
          </div>
        </div>
        <h2 className="titulo-seccion mt-14 mb-6">Otras sedes</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OTRAS_SEDES.map((s, i) => (
            <li key={s} className="flex items-center gap-4 rounded-[var(--radius-card)] border-2 border-[#EEE] bg-white p-5">
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${i % 2 ? 'bg-accent-yellow text-foreground' : 'bg-primary-dark text-white'}`}>
                <School size={22} aria-hidden="true" />
              </span>
              <span className="text-lg font-semibold">Sede {s}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  pei: {
    titulo: 'Proyecto Educativo Institucional (PEI)',
    antetitulo: 'Institucional',
    cuerpo: () => (
      <div className="flex flex-col items-start gap-6">
        <blockquote className="con-barra max-w-3xl font-display text-3xl leading-snug">{PEI_LEMA}</blockquote>
        <Documento titulo="Documento PEI" pdf={PEI_PDF} />
      </div>
    ),
  },
  'manual-de-convivencia': {
    titulo: 'Manual de convivencia',
    antetitulo: 'Institucional',
    intro: MANUAL.lema,
    cuerpo: () => (
      <div className="flex flex-col items-start gap-4">
        <p className="text-[17px] text-body">{MANUAL.publicado}</p>
        <p className="text-body"><strong>Fundamento legal:</strong> {MANUAL.fundamento}</p>
        <Documento titulo="Manual de convivencia 2026" pdf={MANUAL.pdf} />
      </div>
    ),
  },
  docentes: {
    titulo: 'Docentes por materia',
    antetitulo: 'Institucional',
    intro: 'Docentes de la Institución Educativa Cajete, sede Cajete.',
    cuerpo: () => (
      <>
        {(['Mañana', 'Tarde'] as const).map((j) => (
          <div key={j} className="mb-12">
            <h2 className="titulo-seccion mb-6">
              Jornada de la {j.toLowerCase()} · {j === 'Mañana' ? 'Preescolar y primaria' : 'Secundaria'}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DOCENTES.filter((d) => d.jornada === j).map((d) => (
                <li key={d.nombre} className="flex items-center gap-4 rounded-[var(--radius-card)] border-2 border-[#EEE] bg-white p-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
                    <User size={20} aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-semibold">{d.nombre}</span>
                    <span className="text-sm text-muted-text">{d.area}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </>
    ),
  },
  administrativos: {
    titulo: 'Equipo directivo',
    antetitulo: 'Institucional',
    cuerpo: () => (
      <>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DIRECTIVOS.map((d) => (
            <li key={d.nombre} className="tarjeta flex flex-col items-center gap-3 border-t-[6px] border-accent-yellow p-7 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
                <User size={30} aria-hidden="true" />
              </span>
              <span className="text-lg font-semibold">{d.nombre}</span>
              <span className="text-sm text-muted-text">{d.cargo}</span>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-body"><span className="validar">[VALIDAR]</span> Personal administrativo (secretaría, pagaduría, etc.).</p>
      </>
    ),
  },
  'escuela-de-padres': {
    titulo: 'Escuela de padres de familia',
    antetitulo: 'Comunidad',
    cuerpo: () => (
      <div className="grid items-center gap-10 md:grid-cols-[3fr_2fr]">
        <div className="space-y-4 text-[17px] leading-relaxed text-body">
          <p>{ESCUELA_PADRES}</p>
          <h2 className="titulo-seccion pt-4 text-foreground">Conoce nuestros próximos encuentros</h2>
          <p><span className="validar">[VALIDAR]</span> Fechas y temas de los próximos encuentros.</p>
        </div>
        <img
          src="img/escuela-padres.jpg"
          alt="Ilustración de una familia estudiando junta, con el escudo de la institución"
          width={683}
          height={1024}
          loading="lazy"
          className="mx-auto w-full max-w-sm rounded-[var(--radius-card)] shadow-[14px_14px_0_var(--color-accent-yellow)]"
        />
      </div>
    ),
  },
}

export default function PaginaInstitucional({ fija }: { fija?: string }) {
  const { seccion } = useParams()
  const clave = fija ?? seccion

  // /institucional sin sección: índice de todas las secciones.
  if (!clave) {
    const hijos = MENU.find((m) => m.ruta === '/institucional')?.hijos ?? []
    return (
      <>
        <CabeceraPagina antetitulo="Institución Educativa Cajete" titulo="Institucional" />
        <section className="contenedor grid gap-5 py-14 sm:grid-cols-2 lg:grid-cols-3">
          {hijos.map((h) => (
            <Link
              key={h.ruta}
              to={h.ruta}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] border-2 border-[#EEE] bg-white p-5 font-semibold shadow-[var(--shadow-soft)] transition hover:border-accent-yellow hover:text-primary-dark"
            >
              {h.etiqueta}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          ))}
        </section>
      </>
    )
  }

  const info = SECCIONES[clave]
  if (!info) return <NoEncontrada />

  return (
    <>
      <CabeceraPagina antetitulo={info.antetitulo} titulo={info.titulo}>{info.intro}</CabeceraPagina>
      <section className="contenedor py-14">{info.cuerpo()}</section>
    </>
  )
}

function Documento({ titulo, pdf }: { titulo: string; pdf: string | null }) {
  if (pdf) {
    return (
      <a href={pdf} target="_blank" rel="noopener" className="btn-primario">
        <FileText size={18} aria-hidden="true" /> Ver {titulo.toLowerCase()} (PDF)
      </a>
    )
  }
  return (
    <p className="flex items-center gap-3 rounded-[var(--radius-card)] border-2 border-dashed border-line p-5 text-body">
      <FileText className="text-muted-text" aria-hidden="true" />
      <span><span className="validar">[VALIDAR]</span> Falta el PDF de “{titulo}”: el sitio anterior no lo tenía enlazado.</span>
    </p>
  )
}
