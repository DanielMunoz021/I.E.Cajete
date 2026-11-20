import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Copy, KeyRound, Pencil, UserPlus } from 'lucide-react'
import { api, ErrorApi, mensajeDeError } from '../lib/api'
import { useSesion, type Rol } from '../lib/sesion'
import { Aviso, Campo, Cargando, Interruptor, Modal, TituloPanel } from './ui'

type FilaUsuario = {
  id: number
  nombre: string
  correo: string
  rol: Rol
  activo: boolean
  debeCambiarClave: boolean
  ultimoIngreso: string | null
}

type Edicion = { id?: number; nombre: string; correo: string; rol: Rol; activo: boolean; clave: string }

const VACIO: Edicion = { nombre: '', correo: '', rol: 'docente', activo: true, clave: '' }

const fecha = (s: string | null) =>
  s ? new Date(s.replace(' ', 'T')).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : 'Nunca'

export default function Usuarios() {
  const { usuario: yo } = useSesion()
  const [lista, setLista] = useState<FilaUsuario[] | null>(null)
  const [error, setError] = useState('')
  const [editando, setEditando] = useState<Edicion | null>(null)
  const [clave, setClave] = useState<{ nombre: string; correo: string; clave: string } | null>(null)

  const cargar = useCallback(() => {
    api.get<{ usuarios: FilaUsuario[] }>('/usuarios').then((r) => setLista(r.usuarios)).catch((e) => setError(mensajeDeError(e)))
  }, [])
  useEffect(cargar, [cargar])

  const restablecer = async (u: FilaUsuario) => {
    if (!window.confirm(`¿Restablecer la contraseña de ${u.nombre}? Se generará una temporal y deberá cambiarla al entrar.`)) return
    try {
      const r = await api.post<{ claveTemporal: string }>(`/usuarios/${u.id}/restablecer-clave`)
      setClave({ nombre: u.nombre, correo: u.correo, clave: r.claveTemporal })
      cargar()
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  return (
    <>
      <TituloPanel
        titulo="Usuarios"
        descripcion="Solo la administración crea cuentas. Cada usuario recibe una contraseña temporal y la cambia en su primer ingreso."
        acciones={
          <button type="button" className="btn-primario" onClick={() => setEditando({ ...VACIO })}>
            <UserPlus size={18} aria-hidden="true" /> Nuevo usuario
          </button>
        }
      />
      {error && <div className="mb-5"><Aviso>{error}</Aviso></div>}
      {!lista && !error && <Cargando />}

      {lista && (
        <div className="tarjeta overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-yellow-soft text-xs tracking-wide text-muted-text uppercase">
              <tr>
                <th scope="col" className="px-5 py-3">Nombre</th>
                <th scope="col" className="px-5 py-3">Rol</th>
                <th scope="col" className="px-5 py-3">Estado</th>
                <th scope="col" className="px-5 py-3">Último ingreso</th>
                <th scope="col" className="px-5 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((u) => (
                <tr key={u.id} className={`border-b border-line last:border-0 ${u.activo ? '' : 'text-muted-text'}`}>
                  <td className="px-5 py-3.5">
                    <span className="block font-semibold text-foreground">{u.nombre}{u.id === yo?.id && ' (tú)'}</span>
                    <span className="text-muted-text">{u.correo}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${u.rol === 'admin' ? 'bg-primary-dark text-white' : 'bg-accent-sky text-foreground'}`}>
                      {u.rol === 'admin' ? 'Admin' : 'Docente'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {u.activo ? (u.debeCambiarClave ? <span className="rounded-full bg-accent-yellow px-3 py-1 text-xs font-bold text-foreground">Clave temporal</span> : 'Activo') : 'Desactivado'}
                  </td>
                  <td className="px-5 py-3.5">{fecha(u.ultimoIngreso)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditando({ ...u, clave: '' })} className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-line px-3 py-2 font-semibold hover:border-primary-dark" aria-label={`Editar a ${u.nombre}`}>
                        <Pencil size={15} aria-hidden="true" /> Editar
                      </button>
                      <button type="button" onClick={() => void restablecer(u)} className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-line px-3 py-2 font-semibold hover:border-primary-dark" aria-label={`Restablecer la contraseña de ${u.nombre}`}>
                        <KeyRound size={15} aria-hidden="true" /> Clave
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal abierto={!!editando} titulo={editando?.id ? 'Editar usuario' : 'Nuevo usuario'} onCerrar={() => setEditando(null)}>
        {editando && (
          <FormularioUsuario
            inicial={editando}
            esYo={editando.id === yo?.id}
            onGuardado={(r) => {
              setEditando(null)
              if (r.claveTemporal) setClave({ nombre: r.nombre, correo: r.correo, clave: r.claveTemporal })
              cargar()
            }}
          />
        )}
      </Modal>

      <Modal abierto={!!clave} titulo="Contraseña temporal" onCerrar={() => setClave(null)}>
        {clave && <ClaveTemporal {...clave} onListo={() => setClave(null)} />}
      </Modal>
    </>
  )
}

function FormularioUsuario({ inicial, esYo, onGuardado }: { inicial: Edicion; esYo: boolean; onGuardado: (r: { nombre: string; correo: string; claveTemporal?: string }) => void }) {
  const [d, setD] = useState(inicial)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const nuevo = !inicial.id

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      if (nuevo) {
        const r = await api.post<{ claveTemporal: string }>('/usuarios', { nombre: d.nombre, correo: d.correo, rol: d.rol, clave: d.clave })
        onGuardado({ nombre: d.nombre, correo: d.correo, claveTemporal: r.claveTemporal })
      } else {
        await api.put(`/usuarios/${inicial.id}`, { nombre: d.nombre, correo: d.correo, rol: d.rol, activo: d.activo })
        onGuardado({ nombre: d.nombre, correo: d.correo })
      }
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <Campo etiqueta="Nombre completo">
        <input required maxLength={120} value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} className="campo" />
      </Campo>
      <Campo etiqueta="Correo">
        <input type="email" required maxLength={190} value={d.correo} onChange={(e) => setD({ ...d, correo: e.target.value })} className="campo" />
      </Campo>
      <Campo etiqueta="Rol">
        <select value={d.rol} disabled={esYo} onChange={(e) => setD({ ...d, rol: e.target.value as Rol })} className="campo">
          <option value="docente">Docente: sube PDFs y propone proyectos en sus semilleros</option>
          <option value="admin">Administrador: gestiona todo el portal</option>
        </select>
      </Campo>
      {nuevo ? (
        <Campo etiqueta="Contraseña temporal (opcional)" ayuda="Si la dejas vacía, se genera una segura. El usuario la cambiará al entrar.">
          <input value={d.clave} onChange={(e) => setD({ ...d, clave: e.target.value })} className="campo" autoComplete="off" />
        </Campo>
      ) : (
        !esYo && <Interruptor activo={d.activo} onCambio={(v) => setD({ ...d, activo: v })} etiqueta={d.activo ? 'Cuenta activa' : 'Cuenta desactivada (no puede entrar)'} />
      )}
      {error && <Aviso>{error}</Aviso>}
      <button type="submit" disabled={enviando} className="btn-primario self-start disabled:opacity-60">
        {enviando ? 'Guardando…' : nuevo ? 'Crear usuario' : 'Guardar cambios'}
      </button>
    </form>
  )
}

function ClaveTemporal({ nombre, correo, clave, onListo }: { nombre: string; correo: string; clave: string; onListo: () => void }) {
  const [copiado, setCopiado] = useState(false)
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(clave)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }
  return (
    <div className="flex flex-col gap-4">
      <p className="text-body">Entrégale estos datos a <strong>{nombre}</strong>. La contraseña <strong>no se volverá a mostrar</strong> y deberá cambiarla en su primer ingreso.</p>
      <dl className="rounded-[var(--radius-card)] bg-yellow-soft p-5">
        <dt className="text-sm text-muted-text">Correo</dt>
        <dd className="mb-3 font-semibold break-all">{correo}</dd>
        <dt className="text-sm text-muted-text">Contraseña temporal</dt>
        <dd className="font-mono text-xl font-bold tracking-wider">{clave}</dd>
      </dl>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => void copiar()} className="btn-amarillo"><Copy size={18} aria-hidden="true" /> {copiado ? 'Copiada' : 'Copiar contraseña'}</button>
        <button type="button" onClick={onListo} className="btn-secundario">Listo</button>
      </div>
    </div>
  )
}
