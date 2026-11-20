import { useEffect, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router'
import {
  BookOpenText, CircleCheckBig, FileText, FolderKanban, Inbox, LayoutDashboard, LogOut, Menu, Sprout, Star, Users, X,
} from 'lucide-react'
import { useSesion, type Rol } from '../lib/sesion'
import { SIN_SERVIDOR } from '../lib/api'
import CambiarClave from './CambiarClave'
import { Cargando } from './ui'

type Item = { etiqueta: string; ruta: string; icono: typeof Users; roles: Rol[] }

// El menú depende del rol, pero cada acción la vuelve a verificar el servidor.
const MENU: Item[] = [
  { etiqueta: 'Inicio', ruta: '/admin', icono: LayoutDashboard, roles: ['admin', 'docente'] },
  { etiqueta: 'Usuarios', ruta: '/admin/usuarios', icono: Users, roles: ['admin'] },
  { etiqueta: 'Semilleros', ruta: '/admin/semilleros', icono: Sprout, roles: ['admin'] },
  { etiqueta: 'Proyectos', ruta: '/admin/proyectos', icono: FolderKanban, roles: ['admin'] },
  { etiqueta: 'Documentos', ruta: '/admin/documentos', icono: FileText, roles: ['admin'] },
  { etiqueta: 'Sensaciones', ruta: '/admin/sensaciones', icono: BookOpenText, roles: ['admin'] },
  { etiqueta: 'Destacados', ruta: '/admin/destacados', icono: Star, roles: ['admin'] },
  { etiqueta: 'Pendientes', ruta: '/admin/pendientes', icono: Inbox, roles: ['admin'] },
  { etiqueta: 'Mis semilleros', ruta: '/admin/mis-semilleros', icono: Sprout, roles: ['docente'] },
  { etiqueta: 'Mis envíos', ruta: '/admin/mis-envios', icono: CircleCheckBig, roles: ['docente'] },
]

export default function PanelLayout() {
  const { usuario, cargando, salir, errorConexion } = useSesion()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setMenuAbierto(false), [pathname])

  if (SIN_SERVIDOR) return <Navigate to="/portal" replace />
  if (cargando) return <Cargando />
  if (errorConexion && !usuario) {
    return <p className="contenedor py-16 text-center text-danger">{errorConexion}</p>
  }
  if (!usuario) return <Navigate to="/portal" replace />
  if (usuario.debeCambiarClave) return <CambiarClave obligatorio />

  const items = MENU.filter((i) => i.roles.includes(usuario.rol))

  return (
    <div className="flex min-h-screen flex-col bg-muted lg:flex-row">
      {/* Barra superior en celular */}
      <div className="flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <Link to="/" className="block"><img src="img/logo-iecajete.png" alt="Ir al sitio de la Institución Educativa Cajete" width={1131} height={271} className="h-9 w-auto" /></Link>
        <button
          type="button"
          onClick={() => setMenuAbierto((v) => !v)}
          aria-expanded={menuAbierto}
          aria-controls="menu-panel"
          aria-label={menuAbierto ? 'Cerrar menú del panel' : 'Abrir menú del panel'}
          className="flex size-11 items-center justify-center rounded-lg border border-line"
        >
          {menuAbierto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Menú lateral */}
      <aside
        id="menu-panel"
        className={`${menuAbierto ? 'block' : 'hidden'} border-r border-line bg-white lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:shrink-0`}
      >
        <div className="flex h-full flex-col">
          <Link to="/" className="hidden px-5 pt-5 pb-3 lg:block">
            <img src="img/logo-iecajete.png" alt="Ir al sitio de la Institución Educativa Cajete" width={1131} height={271} className="h-11 w-auto" />
          </Link>
          <div className="franja-marca hidden lg:flex" aria-hidden="true" />
          <div className="px-5 pt-4 pb-2">
            <span className="font-menu text-[11px] font-semibold tracking-[2px] text-primary-dark uppercase">
              {usuario.rol === 'admin' ? 'Administración' : 'Portal docente'}
            </span>
          </div>
          <nav aria-label="Menú del panel" className="flex-1 overflow-y-auto px-3">
            <ul className="flex flex-col gap-1">
              {items.map(({ etiqueta, ruta, icono: Icono }) => (
                <li key={ruta}>
                  <NavLink
                    to={ruta}
                    end={ruta === '/admin'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 font-semibold transition-colors ${
                        isActive ? 'bg-primary-dark text-white' : 'text-body hover:bg-yellow-soft'
                      }`
                    }
                  >
                    <Icono size={19} aria-hidden="true" />
                    {etiqueta}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t border-line p-4">
            <p className="truncate font-semibold">{usuario.nombre}</p>
            <p className="truncate text-sm text-muted-text">{usuario.correo}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <Link to="/admin/mi-clave" className="text-primary-dark underline">Cambiar contraseña</Link>
              <button type="button" onClick={() => void salir()} className="flex items-center gap-1 text-danger underline">
                <LogOut size={14} aria-hidden="true" /> Salir
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main id="contenido" tabIndex={-1} className="min-w-0 flex-1 px-4 py-8 outline-none sm:px-8 lg:py-10">
        <Outlet />
      </main>
    </div>
  )
}
