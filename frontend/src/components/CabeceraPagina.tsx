import type { ReactNode } from 'react'

// Banda de título para las páginas internas.
export default function CabeceraPagina({ antetitulo, titulo, children }: { antetitulo?: string; titulo: string; children?: ReactNode }) {
  return (
    <section className="border-b border-line bg-yellow-soft">
      <div className="contenedor py-12 sm:py-14">
        {antetitulo && (
          <span className="font-menu text-xs font-semibold tracking-[3px] text-primary-dark uppercase">{antetitulo}</span>
        )}
        <h1 className="con-barra mt-2 text-4xl leading-tight sm:text-5xl">{titulo}</h1>
        {children && <div className="mt-3 max-w-2xl text-[17px] leading-relaxed text-body">{children}</div>}
      </div>
    </section>
  )
}
