import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { ChevronDown, Globe, Mail, MapPin, Menu, Phone, X } from 'lucide-react'
import { INSTITUCION, MENU, type ItemMenu } from '../data/sitio'

// Encabezado del sitio anterior: franja amarilla con contacto + barra blanca con logo y menú en mayúsculas.
export default function Header() {
  const [abierto, setAbierto] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setAbierto(false), [pathname])

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_2px_10px_rgb(0_0_0/0.06)]">
      {/* Franja superior */}
      <div className="bg-topbar text-foreground">
        <div className="contenedor flex flex-wrap items-center justify-between gap-x-5 gap-y-2 py-1.5 text-sm">
          <div className="hidden flex-wrap items-center gap-x-6 gap-y-1 md:flex">
            <span className="flex items-center gap-1.5">
              <MapPin size={16} aria-hidden="true" />
              {INSTITUCION.direccion}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone size={16} aria-hidden="true" />
              {INSTITUCION.telefono ?? <span className="validar">[VALIDAR teléfono]</span>}
            </span>
            <a href={`mailto:${INSTITUCION.correo}`} className="flex items-center gap-1.5 hover:underline">
              <Mail size={16} aria-hidden="true" />
              {INSTITUCION.correo}
            </a>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {INSTITUCION.redes.map((r) => (
              <a
                key={r.nombre}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={r.nombre}
                className="flex size-7 items-center justify-center rounded-full bg-foreground/10 hover:bg-foreground/20"
              >
                <Globe size={14} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Barra con logo y menú */}
      <div className="contenedor flex items-center justify-between gap-4 py-3 lg:py-4">
        <Link to="/" className="block shrink-0">
          <img
            src="img/logo-iecajete.png"
            alt="Institución Educativa Cajete – Popayán"
            width={1131}
            height={271}
            className="h-12 w-auto lg:h-16"
          />
        </Link>

        <nav aria-label="Menú principal" className="hidden lg:block">
          <ul className="flex items-center gap-7 font-menu text-xs font-medium tracking-[1px] uppercase">
            {MENU.map((item) => (
              <li key={item.ruta}>{item.hijos ? <Desplegable item={item} /> : <Enlace item={item} />}</li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-lg border border-line lg:hidden"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={abierto}
          aria-controls="menu-movil"
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className="franja-marca" aria-hidden="true" />

      {/* Menú en celular */}
      {abierto && (
        <nav id="menu-movil" aria-label="Menú principal" className="border-t border-line lg:hidden">
          <ul className="contenedor flex flex-col py-2 font-menu text-sm font-medium tracking-[1px] uppercase">
            {MENU.map((item) => (
              <li key={item.ruta}>
                <NavLink to={item.ruta} end className={({ isActive }) => `block py-3 ${isActive ? 'text-primary-dark' : ''}`}>
                  {item.etiqueta}
                </NavLink>
                {item.hijos && (
                  <ul className="mb-2 ml-4 border-l border-line pl-4 normal-case tracking-normal">
                    {item.hijos.map((h) => (
                      <li key={h.ruta}>
                        <NavLink to={h.ruta} className="block py-2 font-sans text-[15px] text-body">
                          {h.etiqueta}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}

const claseEnlace = (activo: boolean) =>
  `block border-b-[3px] py-2.5 transition-colors hover:border-accent-yellow ${activo ? 'border-foreground' : 'border-transparent'}`

function Enlace({ item }: { item: ItemMenu }) {
  return (
    <NavLink to={item.ruta} end className={({ isActive }) => claseEnlace(isActive)}>
      {item.etiqueta}
    </NavLink>
  )
}

function Desplegable({ item }: { item: ItemMenu }) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  const activo = pathname.startsWith(item.ruta)

  useEffect(() => setAbierto(false), [pathname])

  useEffect(() => {
    if (!abierto) return
    const cerrar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false)
    }
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    document.addEventListener('mousedown', cerrar)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', cerrar)
      document.removeEventListener('keydown', escape)
    }
  }, [abierto])

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setAbierto(true)} onMouseLeave={() => setAbierto(false)}>
      <button
        type="button"
        className={`${claseEnlace(activo)} flex items-center gap-1 uppercase`}
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
      >
        {item.etiqueta}
        <ChevronDown size={13} strokeWidth={2.5} aria-hidden="true" />
      </button>
      {abierto && (
        <ul className="absolute top-full left-0 z-50 w-64 bg-white py-1 font-sans text-sm font-normal tracking-normal normal-case shadow-[0_0_5px_2px_rgb(0_0_0/0.06)]">
          {item.hijos!.map((h) => (
            <li key={h.ruta}>
              <NavLink
                to={h.ruta}
                className={({ isActive }) =>
                  `block border-b border-line px-5 py-2.5 transition-colors hover:bg-primary-dark hover:text-white ${isActive ? 'text-primary-dark' : 'text-muted-text'}`
                }
              >
                {h.etiqueta}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
