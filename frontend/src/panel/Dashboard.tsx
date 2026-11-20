import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { BookOpenText, CircleCheckBig, CircleX, FileText, FolderKanban, Inbox, Sprout, Users } from 'lucide-react'
import { api, mensajeDeError } from '../lib/api'
import { useSesion } from '../lib/sesion'
import { Aviso, Cargando, TituloPanel } from './ui'

type Resumen = Record<string, number>

const TARJETAS_ADMIN = [
  { clave: 'pendientes', etiqueta: 'Pendientes por aprobar', icono: Inbox, ruta: '/admin/pendientes', destacada: true },
  { clave: 'usuarios', etiqueta: 'Usuarios activos', icono: Users, ruta: '/admin/usuarios' },
  { clave: 'semilleros', etiqueta: 'Semilleros', icono: Sprout, ruta: '/admin/semilleros' },
  { clave: 'proyectos', etiqueta: 'Proyectos publicados', icono: FolderKanban, ruta: '/admin/proyectos' },
  { clave: 'documentos', etiqueta: 'PDFs publicados', icono: FileText, ruta: '/admin/documentos' },
  { clave: 'ediciones', etiqueta: 'Ediciones de Sensaciones', icono: BookOpenText, ruta: '/admin/sensaciones' },
]

const TARJETAS_DOCENTE = [
  { clave: 'semilleros', etiqueta: 'Mis semilleros', icono: Sprout, ruta: '/admin/mis-semilleros', destacada: false },
  { clave: 'pendientes', etiqueta: 'Envíos pendientes', icono: Inbox, ruta: '/admin/mis-envios', destacada: true },
  { clave: 'aprobados', etiqueta: 'Envíos aprobados', icono: CircleCheckBig, ruta: '/admin/mis-envios', destacada: false },
  { clave: 'rechazados', etiqueta: 'Envíos rechazados', icono: CircleX, ruta: '/admin/mis-envios', destacada: false },
]

export default function Dashboard() {
  const { usuario } = useSesion()
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<{ resumen: Resumen }>('/panel/resumen').then((r) => setResumen(r.resumen)).catch((e) => setError(mensajeDeError(e)))
  }, [])

  const tarjetas = usuario?.rol === 'admin' ? TARJETAS_ADMIN : TARJETAS_DOCENTE

  return (
    <>
      <TituloPanel titulo={`Hola, ${usuario?.nombre.split(' ')[0] ?? ''}`} descripcion={usuario?.rol === 'admin' ? 'Resumen del contenido del sitio.' : 'Resumen de tus semilleros y envíos.'} />
      {error && <Aviso>{error}</Aviso>}
      {!resumen && !error && <Cargando />}
      {resumen && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {tarjetas.map(({ clave, etiqueta, icono: Icono, ruta, destacada }) => (
            <Link
              key={clave + etiqueta}
              to={ruta}
              className={`tarjeta flex items-center gap-5 border-t-[6px] p-6 transition-shadow hover:shadow-[0_14px_34px_rgb(0_122_82/0.18)] ${
                destacada && resumen[clave] > 0 ? 'border-accent-yellow' : 'border-primary'
              }`}
            >
              <span className={`flex size-14 shrink-0 items-center justify-center rounded-xl ${destacada ? 'bg-accent-yellow text-foreground' : 'bg-primary-dark text-white'}`}>
                <Icono size={26} aria-hidden="true" />
              </span>
              <span className="flex flex-col">
                <span className="font-display text-4xl leading-none">{resumen[clave] ?? 0}</span>
                <span className="mt-1 text-sm text-muted-text">{etiqueta}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
