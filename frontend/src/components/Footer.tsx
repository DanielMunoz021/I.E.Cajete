import { Link } from 'react-router'
import { Mail, MapPin, Phone } from 'lucide-react'
import { INSTITUCION } from '../data/sitio'
import { CONTACTO_TEXTO } from '../data/institucional'

// El contacto de la institución vive aquí (no hay página de Contacto). irAContacto() baja a este bloque.
export default function Footer() {
  const consulta = encodeURIComponent(CONTACTO_TEXTO.consultaMapa)
  const mapa = `https://www.google.com/maps/search/?api=1&query=${consulta}`

  return (
    <footer id="contacto" className="scroll-mt-32 bg-foreground text-[#E5E5E5]">
      <div className="franja-marca" aria-hidden="true" />
      {/* Agenda una visita + mapa (como la página de contacto del sitio actual) */}
      <div className="contenedor grid items-center gap-8 border-b border-[#333] py-12 md:grid-cols-2">
        <div className="flex flex-col items-start gap-3">
          <span className="etiqueta bg-accent-yellow">Contacto</span>
          <h2 className="font-display text-3xl text-white">{CONTACTO_TEXTO.titulo}</h2>
          <p className="max-w-md text-[17px] leading-relaxed">{CONTACTO_TEXTO.texto}</p>
          <a href={`mailto:${INSTITUCION.correo}`} className="btn-amarillo mt-1">
            <Mail size={18} aria-hidden="true" /> Escríbenos
          </a>
        </div>
        <iframe
          title="Mapa de la ubicación de la Institución Educativa Cajete"
          src={`https://www.google.com/maps?q=${consulta}&output=embed&hl=es&z=14`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-64 w-full rounded-[var(--radius-card)] border-0"
        />
      </div>
      <div className="contenedor grid gap-9 py-14 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-2.5">
          <span className="con-barra font-display text-[22px] text-white">{INSTITUCION.nombre}</span>
          <span className="text-[15px] text-[#BDBDBD]">{INSTITUCION.lema}</span>
        </div>
        <nav aria-label="Enlaces rápidos" className="flex flex-col gap-2.5">
          <span className="font-bold text-white">Enlaces rápidos</span>
          <Link to="/institucional" className="hover:text-accent-yellow">Institucional</Link>
          <Link to="/sensaciones" className="hover:text-accent-yellow">Sensaciones</Link>
          <Link to="/proyectos" className="hover:text-accent-yellow">Proyectos y semilleros</Link>
          <Link to="/portal" className="hover:text-accent-yellow">Portal docente</Link>
        </nav>
        <address className="flex flex-col gap-3 text-[15px] not-italic">
          <h2 className="font-sans text-base font-bold text-white">Contacto</h2>
          <span className="flex gap-2.5">
            <MapPin size={18} className="mt-0.5 shrink-0 text-accent-yellow" aria-hidden="true" />
            <span>
              {INSTITUCION.direccion}, Popayán, Cauca ·{' '}
              <a href={mapa} target="_blank" rel="noopener noreferrer" className="underline hover:text-accent-yellow">Ver mapa</a>
            </span>
          </span>
          <span className="flex gap-2.5">
            <Phone size={18} className="mt-0.5 shrink-0 text-accent-yellow" aria-hidden="true" />
            {INSTITUCION.telefono ?? <span className="validar">[VALIDAR teléfono]</span>}
          </span>
          <a href={`mailto:${INSTITUCION.correo}`} className="flex gap-2.5 break-all hover:text-accent-yellow">
            <Mail size={18} className="mt-0.5 shrink-0 text-accent-yellow" aria-hidden="true" />
            {INSTITUCION.correo}
          </a>
        </address>
      </div>
      <div className="contenedor flex flex-wrap justify-between gap-3 border-t border-[#333] py-6 text-sm text-[#BDBDBD]">
        <span>© {new Date().getFullYear()} {INSTITUCION.nombre}</span>
        <span className="flex gap-5">
          <span>Protección de datos <span className="validar">[VALIDAR]</span></span>
          <span>Términos <span className="validar">[VALIDAR]</span></span>
        </span>
      </div>
    </footer>
  )
}
