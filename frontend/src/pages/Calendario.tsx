import CabeceraPagina from '../components/CabeceraPagina'

export default function Calendario() {
  return (
    <>
      <CabeceraPagina antetitulo="Institucional" titulo="Calendario académico 2026" />
      <section className="contenedor py-14">
        <a href="img/calendario-2026.jpg" target="_blank" rel="noopener" className="mx-auto block max-w-[744px]">
          <img
            src="img/calendario-2026.jpg"
            alt="Calendario académico 2026 de la Institución Educativa Cajete"
            width={744}
            height={1024}
            className="w-full rounded-[var(--radius-card)] shadow-[var(--shadow-card)]"
          />
        </a>
        <p className="mt-4 text-center text-sm text-muted-text">Haz clic en la imagen para verla en tamaño completo.</p>
      </section>
    </>
  )
}
