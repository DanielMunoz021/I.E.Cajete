import { Link } from 'react-router'
import { ArrowRight, BookOpen, CalendarDays, Clock, FileText, ListChecks, UserPlus } from 'lucide-react'
import { CIFRAS, EDICIONES, GALERIA, INSTITUCION, SENSACIONES_ESLOGAN } from '../data/sitio'
import { ALIADOS, DIRECTIVOS, DISTINTIVOS, FUNDACION, NIVELES, RESENA } from '../data/institucional'
import CarruselPortada from '../components/CarruselPortada'
import { irAContacto } from '../lib/navegacion'

// Colores de las tarjetas de niveles: verde, amarillo y celeste del escudo (texto siempre con contraste AA).
const ESTILO_NIVEL = [
  'bg-primary-dark text-white',
  'bg-accent-yellow text-foreground',
  'bg-accent-sky text-foreground',
]

const ACCESOS = [
  { titulo: 'Inscripciones y Matrículas', icono: UserPlus, ruta: '#contacto' },
  { titulo: 'Calendario Académico', icono: CalendarDays, ruta: '/institucional/calendario' },
  { titulo: 'Horarios', icono: Clock, ruta: '/institucional' },
  { titulo: 'Lista de útiles', icono: ListChecks, ruta: '/institucional' },
  { titulo: 'Manual de Convivencia', icono: BookOpen, ruta: '/institucional/manual-de-convivencia' },
  { titulo: 'PEI', icono: FileText, ruta: '/institucional/pei' },
]

export default function Inicio() {
  const ultima = EDICIONES[0]

  return (
    <>
      {/* HERO */}
      <section className="relative flex min-h-[560px] items-center overflow-hidden">
        <CarruselPortada />
        <div className="contenedor relative pt-16 pb-32">
          <div className="flex max-w-[580px] flex-col items-start gap-4 rounded-[var(--radius-card)] bg-white/93 p-7 shadow-[0_20px_50px_rgb(0_80_54/0.25)] sm:p-10">
            <span className="etiqueta bg-accent-yellow">Sitio oficial</span>
            <h1 className="text-4xl leading-[1.08] sm:text-[52px]">{INSTITUCION.nombre}</h1>
            <p className="text-lg text-body">{INSTITUCION.lema}</p>
            <div className="mt-1 flex flex-wrap gap-3">
              <button type="button" onClick={irAContacto} className="btn-primario">Inscripciones y matrículas</button>
              <Link to="/institucional" className="btn-amarillo">Conoce la institución</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CIFRAS */}
      <section aria-label="Cifras" className="contenedor relative z-10 -mt-[72px]">
        <div className={`grid gap-5 ${CIFRAS.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
          {CIFRAS.map((c) => (
            <div key={c.etiqueta} className="tarjeta flex flex-col gap-1 border-t-[6px] border-accent-yellow p-7">
              <span className="font-display text-[46px] leading-none text-primary-dark">
                {c.valor ?? <span className="validar text-3xl">[VALIDAR]</span>}
              </span>
              <span className="text-[15px] text-muted-text">{c.etiqueta}</span>
            </div>
          ))}
        </div>
      </section>

      {/* DISTINTIVOS (bloques del inicio del sitio actual) */}
      <section aria-label="Lo que nos distingue" className="contenedor mt-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DISTINTIVOS.map((d, i) => (
            <div key={d.titulo} className="flex flex-col gap-2 border-l-0 pt-3">
              <span className={`h-1.5 w-12 rounded ${i % 2 ? 'bg-primary' : 'bg-accent-yellow'}`} aria-hidden="true" />
              <h2 className="mt-1 font-display text-xl">{d.titulo}</h2>
              <p className="text-[15px] leading-relaxed text-body">{d.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ACCESOS RÁPIDOS */}
      <section className="contenedor mt-22">
        <h2 className="titulo-seccion">Accesos rápidos</h2>
        <p className="mt-2 mb-7 text-muted-text">Lo que más consultan estudiantes y familias.</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ACCESOS.map(({ titulo, icono: Icono, ruta }, i) => {
            const clase =
              'flex items-center gap-4 rounded-[var(--radius-card)] border-2 border-[#EEE] bg-white p-5 shadow-[var(--shadow-soft)] transition hover:border-accent-yellow hover:shadow-[var(--shadow-card)]'
            // Íconos alternos: verde con ícono blanco / amarillo con ícono oscuro.
            const cuadro = i % 2 === 0 ? 'bg-primary-dark text-white' : 'bg-accent-yellow text-foreground'
            const contenido = (
              <>
                <span className={`flex size-13 shrink-0 items-center justify-center rounded-xl ${cuadro}`}>
                  <Icono size={24} aria-hidden="true" />
                </span>
                <span className="text-[17px] font-semibold">{titulo}</span>
              </>
            )
            // "#contacto" baja al pie de página; lo demás son rutas del sitio.
            return ruta === '#contacto' ? (
              <button key={titulo} type="button" onClick={irAContacto} className={`${clase} text-left`}>{contenido}</button>
            ) : (
              <Link key={titulo} to={ruta} className={clase}>{contenido}</Link>
            )
          })}
        </div>
      </section>

      {/* SOBRE NOSOTROS */}
      <section className="contenedor mt-22 grid items-center gap-10 md:grid-cols-2">
        <img
          src="img/sede-cajete.jpg"
          alt="Estudiantes con trajes típicos frente a la sede principal de la institución"
          width={800}
          height={424}
          loading="lazy"
          className="w-full rounded-[var(--radius-card)] shadow-[14px_14px_0_var(--color-accent-yellow)]"
        />
        <div className="flex flex-col items-start gap-4">
          <span className="etiqueta bg-accent-yellow">Desde {FUNDACION}</span>
          <h2 className="titulo-seccion">Sobre nosotros</h2>
          {RESENA.map((p) => (
            <p key={p} className="text-[17px] leading-relaxed text-body">{p}</p>
          ))}
          <p className="text-body">
            <strong>{DIRECTIVOS[0].nombre}</strong>, {DIRECTIVOS[0].cargo.toLowerCase()}
          </p>
          <Link to="/institucional/resena" className="btn-secundario">Conoce nuestra historia</Link>
        </div>
      </section>

      {/* NIVELES EDUCATIVOS */}
      <section className="contenedor mt-22">
        <h2 className="titulo-seccion mb-7">Niveles educativos</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {NIVELES.map((n, i) => (
            <article key={n.nombre} className={`rounded-[var(--radius-card)] p-7 shadow-[var(--shadow-soft)] ${ESTILO_NIVEL[i % 3]}`}>
              <h3 className="font-display text-2xl">{n.nombre}</h3>
              <p className="mt-1 font-semibold">{n.lema}</p>
              <p className="mt-3 leading-relaxed">{n.texto}</p>
            </article>
          ))}
        </div>
      </section>

      {/* SENSACIONES */}
      <section className="mt-22 bg-yellow-soft py-18">
        <div className="contenedor flex flex-wrap items-center gap-10">
          <div className="flex min-w-0 flex-[1_1_380px] flex-col items-start gap-3.5">
            <span className="etiqueta bg-accent-sky">Magazine escolar</span>
            <h2 className="con-barra text-5xl leading-none">Sensaciones</h2>
            <p className="text-lg text-body italic">“{SENSACIONES_ESLOGAN}”</p>
            <p className="text-[17px] leading-relaxed text-body">
              El periódico de la Institución Educativa Cajete. Ya está disponible la {ultima.nombre.toLowerCase()} ({ultima.fecha}).
            </p>
            <Link to="/sensaciones" className="btn-primario mt-1">
              Leer Sensaciones <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <Link to="/sensaciones" className="mx-auto block w-full max-w-[320px] flex-[0_1_320px]">
            <img
              src={ultima.portada ?? undefined}
              alt={`Portada de Sensaciones, ${ultima.nombre.toLowerCase()}, ${ultima.fecha}`}
              width={744}
              height={1024}
              loading="lazy"
              className="w-full rounded-[var(--radius-card)] shadow-[14px_14px_0_var(--color-accent-yellow),0_20px_44px_rgb(0_122_82/0.2)] transition-transform hover:-translate-y-1"
            />
          </Link>
        </div>
      </section>

      {/* GALERÍA */}
      <section className="contenedor py-20">
        <h2 className="titulo-seccion mb-7">Vida en la institución</h2>
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {GALERIA.map((f) => (
            <img
              key={f.src}
              src={f.src}
              alt={f.alt}
              width={f.ancho}
              height={f.alto}
              loading="lazy"
              className="mb-5 w-full break-inside-avoid rounded-[var(--radius-card)] shadow-[var(--shadow-soft)]"
            />
          ))}
        </div>
      </section>

      {/* ALIADOS */}
      <section aria-label="Aliados" className="border-t border-line bg-yellow-soft">
        <div className="contenedor flex flex-wrap items-center justify-center gap-x-12 gap-y-6 py-10">
          {ALIADOS.map((a) => (
            <img key={a.nombre} src={a.logo} alt={a.nombre} width={211} height={71} loading="lazy" className="h-14 w-auto" />
          ))}
        </div>
      </section>
    </>
  )
}
