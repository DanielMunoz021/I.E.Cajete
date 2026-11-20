// Sesión del portal: quién está conectado. El servidor decide los permisos;
// aquí solo se usa para mostrar u ocultar opciones.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, fijarCsrf, SIN_SERVIDOR } from './api'

export type Rol = 'admin' | 'docente'
export type Usuario = { id: number; nombre: string; correo: string; rol: Rol; debeCambiarClave: boolean }

type RespuestaSesion = { usuario: Usuario | null; csrf: string }

type Contexto = {
  usuario: Usuario | null
  cargando: boolean
  errorConexion: string | null
  ingresar: (correo: string, clave: string) => Promise<Usuario>
  salir: () => Promise<void>
  cambiarClave: (actual: string, nueva: string) => Promise<void>
  recargar: () => Promise<void>
}

const SesionContexto = createContext<Contexto | null>(null)

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorConexion, setErrorConexion] = useState<string | null>(null)

  const recargar = useCallback(async () => {
    if (SIN_SERVIDOR) {
      setCargando(false)
      return
    }
    try {
      const r = await api.get<RespuestaSesion>('/sesion')
      fijarCsrf(r.csrf)
      setUsuario(r.usuario)
      setErrorConexion(null)
    } catch (e) {
      setErrorConexion(e instanceof Error ? e.message : 'Sin conexión')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void recargar()
  }, [recargar])

  const ingresar = async (correo: string, clave: string) => {
    const r = await api.post<RespuestaSesion>('/login', { correo, clave })
    setUsuario(r.usuario)
    return r.usuario!
  }

  const salir = async () => {
    await api.post('/logout')
    setUsuario(null)
  }

  const cambiarClave = async (actual: string, nueva: string) => {
    const r = await api.post<RespuestaSesion>('/cambiar-clave', { actual, nueva })
    setUsuario(r.usuario)
  }

  return (
    <SesionContexto.Provider value={{ usuario, cargando, errorConexion, ingresar, salir, cambiarClave, recargar }}>
      {children}
    </SesionContexto.Provider>
  )
}

export function useSesion() {
  const c = useContext(SesionContexto)
  if (!c) throw new Error('useSesion debe usarse dentro de <SesionProvider>')
  return c
}
