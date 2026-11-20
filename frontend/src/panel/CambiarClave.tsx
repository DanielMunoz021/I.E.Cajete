import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { KeyRound } from 'lucide-react'
import { useSesion } from '../lib/sesion'
import { mensajeDeError } from '../lib/api'
import { Aviso, Campo } from './ui'

// Cambio de contraseña. Con `obligatorio`, es la única pantalla disponible hasta cambiar la temporal.
export default function CambiarClave({ obligatorio = false }: { obligatorio?: boolean }) {
  const { usuario, cambiarClave, salir } = useSesion()
  const navegar = useNavigate()
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (nueva !== repetir) return setError('Las contraseñas nuevas no coinciden.')
    setEnviando(true)
    try {
      await cambiarClave(actual, nueva)
      setOk(true)
      if (obligatorio) navegar('/admin', { replace: true })
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  const formulario = (
    <form onSubmit={enviar} className="tarjeta flex w-full max-w-md flex-col gap-4 border-t-[6px] border-accent-yellow p-8">
      <h1 className="flex items-center gap-2 text-2xl"><KeyRound className="text-primary-dark" aria-hidden="true" /> Cambiar contraseña</h1>
      {obligatorio && (
        <Aviso tipo="info">Hola, {usuario?.nombre}. Estás usando una contraseña temporal: crea una propia para continuar.</Aviso>
      )}
      <Campo etiqueta={obligatorio ? 'Contraseña temporal' : 'Contraseña actual'}>
        <input type="password" required value={actual} onChange={(e) => setActual(e.target.value)} className="campo" autoComplete="current-password" />
      </Campo>
      <Campo etiqueta="Nueva contraseña" ayuda="Mínimo 10 caracteres, con letras y números.">
        <input type="password" required minLength={10} value={nueva} onChange={(e) => setNueva(e.target.value)} className="campo" autoComplete="new-password" />
      </Campo>
      <Campo etiqueta="Repite la nueva contraseña">
        <input type="password" required minLength={10} value={repetir} onChange={(e) => setRepetir(e.target.value)} className="campo" autoComplete="new-password" />
      </Campo>
      {error && <Aviso>{error}</Aviso>}
      {ok && !obligatorio && <Aviso tipo="ok">Contraseña actualizada.</Aviso>}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={enviando} className="btn-primario disabled:opacity-60">{enviando ? 'Guardando…' : 'Guardar contraseña'}</button>
        {obligatorio && (
          <button type="button" onClick={() => void salir()} className="text-sm text-muted-text underline">Salir</button>
        )}
      </div>
    </form>
  )

  if (obligatorio) {
    return <div className="flex min-h-screen items-center justify-center bg-yellow-soft p-4">{formulario}</div>
  }
  return formulario
}
