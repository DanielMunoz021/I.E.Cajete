import CabeceraPagina from '../components/CabeceraPagina'
import { EXALUMNOS } from '../data/institucional'

export default function Exalumnos() {
  return (
    <>
      <CabeceraPagina antetitulo="Comunidad" titulo="Exalumnos">
        <strong className="font-display text-2xl font-normal text-foreground">{EXALUMNOS.titulo}</strong>
        <span className="mt-2 block">{EXALUMNOS.texto}</span>
      </CabeceraPagina>
      <section className="contenedor flex flex-col gap-8 py-14">
        <figure>
          <img src="img/exalumnos-2025.jpg" alt="Foto de grupo de la promoción 2025" width={1536} height={459} className="w-full rounded-[var(--radius-card)] shadow-[var(--shadow-card)]" />
          <figcaption className="mt-2 text-sm text-muted-text">Promoción 2025</figcaption>
        </figure>
        <figure>
          <img src="img/exalumnos-2.jpg" alt="Foto de grupo de egresados" width={1024} height={397} loading="lazy" className="w-full rounded-[var(--radius-card)] shadow-[var(--shadow-card)]" />
          <figcaption className="mt-2 text-sm text-muted-text"><span className="validar">[VALIDAR año de la promoción]</span></figcaption>
        </figure>
      </section>
    </>
  )
}
