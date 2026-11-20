import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { LogIn } from 'lucide-react'
import CabeceraPagina from '../components/CabeceraPagina'
import { useSesion } from '../lib/sesion'
import { mensajeDeError, SIN_SERVIDOR } from '../lib/api'

// /portal: inicio de sesión de docentes y administradores. No hay registro público.
export default function Ingreso() {
  const { usuario, cargando, ingresar } = useSesion()
  const navegar = useNavigate()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!cargando && usuario) return <Navigate to="/admin" replace />

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await ingresar(correo, clave)
      navegar('/admin')
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <CabeceraPagina antetitulo="Acceso docentes" titulo="Portal docente">
        Sube los trabajos de tus semilleros y consulta el estado de tus envíos. Las cuentas las crea la administración.
      </CabeceraPagina>
      <section className="contenedor py-12">
        {SIN_SERVIDOR ? (
          <p className="mx-auto max-w-md rounded-[var(--radius-card)] bg-sky-soft p-6 text-sky-text">
            El portal funciona cuando el sitio está publicado en el hosting (o con el servidor local). Abierto con doble clic solo se ven las páginas públicas.
          </p>
        ) : (
          <form onSubmit={enviar} className="tarjeta mx-auto flex max-w-md flex-col gap-4 border-t-[6px] border-accent-yellow p-8" noValidate>
            <h2 className="text-2xl">Ingresar</h2>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Correo
              <input type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} className="campo" autoComplete="username" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Contraseña
              <input type="password" required value={clave} onChange={(e) => setClave(e.target.value)} className="campo" autoComplete="current-password" />
            </label>
            {error && <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{error}</p>}
            <button type="submit" disabled={enviando} className="btn-primario justify-center disabled:opacity-60">
              <LogIn size={18} aria-hidden="true" /> {enviando ? 'Ingresando…' : 'Entrar'}
            </button>
            <p className="text-sm text-muted-text">¿Olvidaste tu contraseña? Pídele a la administración que la restablezca.</p>
          </form>
        )}
      </section>
    </>
  )
}
