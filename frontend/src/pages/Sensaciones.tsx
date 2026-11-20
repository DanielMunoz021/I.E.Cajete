import { BookOpen, Download } from 'lucide-react'
import { EDICIONES, SENSACIONES_ESLOGAN, SENSACIONES_INTRO } from '../data/sitio'

export default function Sensaciones() {
  const [ultima, ...anteriores] = EDICIONES

  return (
    <>
      {/* Cabecera del periódico */}
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

      {/* Última edición */}
      <section className="contenedor flex flex-wrap items-start gap-12 py-16">
        <a href={ultima.pdf} target="_blank" rel="noopener" className="mx-auto block w-full max-w-[380px] flex-[0_1_380px]">
          <img
            src={ultima.portada ?? undefined}
            alt={`Portada de Sensaciones, ${ultima.nombre.toLowerCase()}, ${ultima.fecha}`}
            width={744}
            height={1024}
            className="w-full rounded-[var(--radius-card)] shadow-[14px_14px_0_var(--color-accent-yellow),0_20px_44px_rgb(0_122_82/0.18)]"
          />
        </a>
        <div className="flex min-w-0 flex-[1_1_480px] flex-col items-start gap-4">
          <span className="etiqueta bg-accent-yellow">Última edición</span>
          <h2 className="text-4xl leading-tight">
            {ultima.nombre} · {ultima.fecha}
          </h2>
          <div className="flex flex-wrap gap-3">
            <a href={ultima.pdf} target="_blank" rel="noopener" className="btn-primario">
              <BookOpen size={18} aria-hidden="true" /> Leer en línea
            </a>
            <a href={ultima.pdf} download className="btn-amarillo">
              <Download size={18} aria-hidden="true" /> Descargar PDF
            </a>
          </div>

          <h3 className="mt-5 font-menu text-xs font-semibold tracking-[2px] text-muted-text uppercase">En esta edición</h3>
          <ul className="w-full">
            {ultima.articulos.map((a) => (
              <li key={a.titulo} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-line py-3.5 last:border-b">
                <span className="w-16 shrink-0 text-sm font-bold text-primary-dark">Pág. {a.pagina}</span>
                <span className="flex-[1_1_220px] text-[17px] font-semibold">{a.titulo}</span>
                {a.autor && <span className="text-sm text-muted-text">{a.autor}</span>}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Ediciones anteriores (aparece cuando haya más de una) */}
      {anteriores.length > 0 && (
        <section className="contenedor pb-20">
          <h2 className="titulo-seccion mb-7">Ediciones anteriores</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {anteriores.map((e) => (
              <a key={e.numero} href={e.pdf} target="_blank" rel="noopener" className="group flex flex-col gap-2">
                {e.portada ? (
                  <img src={e.portada} alt={`Portada de Sensaciones, ${e.nombre.toLowerCase()}`} width={744} height={1024} loading="lazy" className="rounded-[var(--radius-card)] shadow-[var(--shadow-soft)]" />
                ) : (
                  // Sin imagen de portada: portada generada con la identidad del magazine.
                  <span className="flex aspect-[744/1024] flex-col justify-between rounded-[var(--radius-card)] border-t-8 border-accent-yellow bg-primary-dark p-4 text-white shadow-[var(--shadow-soft)] transition-transform group-hover:-translate-y-1">
                    <span className="font-display text-2xl leading-none">Sensaciones</span>
                    <span>
                      <span className="block font-display text-5xl text-accent-yellow">N.º {e.numero}</span>
                      <span className="text-sm">{e.fecha}</span>
                    </span>
                  </span>
                )}
                <span className="font-semibold">{e.nombre}</span>
                <span className="-mt-1.5 text-sm text-muted-text">{e.fecha} · PDF</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
