import { useState } from 'react'
import { BookOpen, Download } from 'lucide-react'
import { SENSACIONES_ESLOGAN, SENSACIONES_INTRO } from '../data/sitio'
import { useEdiciones, type EdicionSensaciones } from '../lib/ediciones'
import VisorPdf from '../components/VisorPdf'

const descarga = (pdf: string) => (pdf.startsWith('api/') ? `${pdf}?descargar=1` : pdf)

export default function Sensaciones() {
  const { ediciones, cargando } = useEdiciones()
  const [leyendo, setLeyendo] = useState<EdicionSensaciones | null>(null)
  const ultima = ediciones[0]

  return (
    <>
      {/* Cabecera del magazine */}
      <section className="border-b border-line bg-yellow-soft">
        <div className="contenedor flex flex-col items-center gap-3 py-14 text-center">
          <span className="font-menu text-xs font-semibold tracking-[3px] text-primary-dark uppercase">Magazine escolar · IE Cajete</span>
          <div className="flex w-full max-w-[820px] items-center gap-5">
            <span className="h-[3px] flex-1 bg-primary" aria-hidden="true" />
            <h1 className="text-5xl leading-none tracking-tight sm:text-[84px]">Sensaciones</h1>
            <span className="h-[3px] flex-1 bg-accent-yellow" aria-hidden="true" />
          </div>
          <p className="max-w-[620px] text-[17px] text-body italic">“{SENSACIONES_ESLOGAN}”</p>
          <div className="mt-3 max-w-[760px] space-y-3 text-[16px] leading-relaxed text-body">
            {SENSACIONES_INTRO.map((p) => <p key={p}>{p}</p>)}
          </div>
        </div>
      </section>

      {cargando && <p className="contenedor py-14 text-muted-text" role="status">Cargando ediciones…</p>}

      {/* Última edición */}
      {ultima && (
        <section className="contenedor flex flex-wrap items-start gap-12 py-16">
          <button type="button" onClick={() => setLeyendo(ultima)} className="mx-auto block w-full max-w-[380px] flex-[0_1_380px]" aria-label={`Leer ${ultima.titulo}`}>
            <Portada edicion={ultima} grande />
          </button>
          <div className="flex min-w-0 flex-[1_1_480px] flex-col items-start gap-4">
            <span className="etiqueta bg-accent-yellow">Última edición</span>
            <h2 className="text-4xl leading-tight">{ultima.titulo} · {ultima.fechaTexto}</h2>
            {ultima.descripcion && <p className="text-[17px] leading-relaxed whitespace-pre-line text-body">{ultima.descripcion}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setLeyendo(ultima)} className="btn-primario"><BookOpen size={18} aria-hidden="true" /> Leer aquí</button>
              <a href={descarga(ultima.pdf)} download className="btn-amarillo"><Download size={18} aria-hidden="true" /> Descargar PDF</a>
            </div>
          </div>
        </section>
      )}

      {/* Todas las ediciones */}
      {ediciones.length > 1 && (
        <section className="contenedor pb-20">
          <h2 className="titulo-seccion mb-8">Todas las ediciones</h2>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {ediciones.map((e) => (
              <li key={e.id} className="flex flex-col gap-2">
                <button type="button" onClick={() => setLeyendo(e)} className="group block text-left" aria-label={`Leer ${e.titulo}`}>
                  <Portada edicion={e} />
                </button>
                <span className="font-semibold">{e.titulo}</span>
                <span className="-mt-1.5 text-sm text-muted-text">{e.fechaTexto}</span>
                <span className="flex flex-wrap gap-x-4 text-sm font-semibold">
                  <button type="button" onClick={() => setLeyendo(e)} className="text-primary-dark underline">Leer</button>
                  <a href={descarga(e.pdf)} download className="text-primary-dark underline">Descargar</a>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <VisorPdf url={leyendo?.pdf ?? null} titulo={leyendo ? `Sensaciones · ${leyendo.titulo}` : ''} onCerrar={() => setLeyendo(null)} />
    </>
  )
}

/** Portada de la edición, o una portada generada con la identidad del magazine si no tiene imagen. */
export function Portada({ edicion, grande = false }: { edicion: EdicionSensaciones; grande?: boolean }) {
  const sombra = grande ? 'shadow-[14px_14px_0_var(--color-accent-yellow),0_20px_44px_rgb(0_122_82/0.18)]' : 'shadow-[var(--shadow-soft)]'
  if (edicion.portada) {
    return (
      <img
        src={edicion.portada}
        alt={`Portada de Sensaciones, ${edicion.titulo.toLowerCase()}, ${edicion.fechaTexto}`}
        width={744}
        height={1024}
        loading={grande ? undefined : 'lazy'}
        className={`aspect-[744/1024] w-full rounded-[var(--radius-card)] object-cover transition-transform group-hover:-translate-y-1 ${sombra}`}
      />
    )
  }
  return (
    <span className={`flex aspect-[744/1024] w-full flex-col justify-between rounded-[var(--radius-card)] border-t-8 border-accent-yellow bg-primary-dark p-4 text-left text-white transition-transform group-hover:-translate-y-1 ${sombra}`}>
      <span className={`font-display leading-none ${grande ? 'text-4xl' : 'text-2xl'}`}>Sensaciones</span>
      <span>
        <span className={`block font-display text-accent-yellow ${grande ? 'text-7xl' : 'text-5xl'}`}>N.º {edicion.numero}</span>
        <span className="text-sm">{edicion.fechaTexto}</span>
      </span>
    </span>
  )
}
