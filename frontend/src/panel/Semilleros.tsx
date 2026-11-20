import { useState, type FormEvent } from 'react'
import { ExternalLink, Pencil, Plus, Sprout } from 'lucide-react'
import { api, mensajeDeError } from '../lib/api'
import { Aviso, BotonEliminar, Campo, CampoArchivo, Cargando, Interruptor, Modal, TituloPanel, useDatos } from './ui'
import type { SemilleroAdmin, UsuarioLista } from './tipos'

export default function Semilleros() {
  const { datos, error, recargar } = useDatos<{ semilleros: SemilleroAdmin[] }>('/admin/semilleros')
  const { datos: usuarios } = useDatos<{ usuarios: UsuarioLista[] }>('/usuarios')
  const [editando, setEditando] = useState<SemilleroAdmin | 'nuevo' | null>(null)
  const [aviso, setAviso] = useState('')

  const eliminar = async (s: SemilleroAdmin) => {
    try {
      await api.delete(`/semilleros/${s.id}`)
      recargar()
    } catch (e) {
      setAviso(mensajeDeError(e))
    }
  }

  return (
    <>
      <TituloPanel
        titulo="Semilleros"
        descripcion="Crea los semilleros de investigación y asigna a los docentes que pueden proponer proyectos y subir PDFs en cada uno."
        acciones={<button type="button" className="btn-primario" onClick={() => setEditando('nuevo')}><Plus size={18} aria-hidden="true" /> Nuevo semillero</button>}
      />
      {(error || aviso) && <div className="mb-5"><Aviso>{error || aviso}</Aviso></div>}
      {!datos && !error && <Cargando />}
      {datos && datos.semilleros.length === 0 && (
        <p className="rounded-[var(--radius-card)] border-2 border-dashed border-line bg-white p-8 text-center text-muted-text">Todavía no hay semilleros. Crea el primero.</p>
      )}
      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {datos?.semilleros.map((s) => (
          <li key={s.id} className={`tarjeta flex flex-col overflow-hidden ${s.activo ? '' : 'opacity-70'}`}>
            {s.imagen ? (
              <img src={s.imagen} alt="" className="h-36 w-full object-cover" />
            ) : (
              <div className="flex h-36 items-center justify-center bg-primary-soft text-primary-dark"><Sprout size={40} aria-hidden="true" /></div>
            )}
            <div className="flex flex-1 flex-col gap-2 p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl">{s.nombre}</h2>
                {!s.activo && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-text">Inactivo</span>}
              </div>
              <p className="text-sm text-muted-text">
                Líder: {s.lider ?? 'sin asignar'} · {s.docentes.length} docente{s.docentes.length === 1 ? '' : 's'} · {s.proyectos} proyecto{s.proyectos === 1 ? '' : 's'}
              </p>
              <div className="mt-auto flex flex-wrap gap-2 pt-3">
                <button type="button" onClick={() => setEditando(s)} className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-line px-3 py-2 text-sm font-semibold hover:border-primary-dark">
                  <Pencil size={15} aria-hidden="true" /> Editar
                </button>
                {s.activo && (
                  <a href={`semilleros/${s.slug}`} target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-line px-3 py-2 text-sm font-semibold hover:border-primary-dark">
                    <ExternalLink size={15} aria-hidden="true" /> Ver
                  </a>
                )}
                <BotonEliminar
                  etiqueta={`Eliminar ${s.nombre}`}
                  confirmar={`¿Eliminar "${s.nombre}"? También se borran sus ${s.proyectos} proyectos y todos sus PDFs. No se puede deshacer.`}
                  onEliminar={() => eliminar(s)}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Modal abierto={!!editando} titulo={editando === 'nuevo' ? 'Nuevo semillero' : 'Editar semillero'} onCerrar={() => setEditando(null)}>
        {editando && (
          <FormularioSemillero
            semillero={editando === 'nuevo' ? null : editando}
            usuarios={usuarios?.usuarios ?? []}
            onGuardado={() => { setEditando(null); recargar() }}
          />
        )}
      </Modal>
    </>
  )
}

function FormularioSemillero({ semillero, usuarios, onGuardado }: { semillero: SemilleroAdmin | null; usuarios: UsuarioLista[]; onGuardado: () => void }) {
  const [activo, setActivo] = useState(semillero?.activo ?? true)
  const [quitarImagen, setQuitarImagen] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const docentes = usuarios.filter((u) => u.rol === 'docente' && u.activo)

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('activo', activo ? '1' : '0')
    if (quitarImagen) fd.set('quitar_imagen', '1')
    if (!fd.getAll('docentes[]').length) fd.set('docentes', '')
    setEnviando(true)
    setError('')
    try {
      await api.post(semillero ? `/semilleros/${semillero.id}` : '/semilleros', fd)
      onGuardado()
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <Campo etiqueta="Nombre del semillero">
        <input name="nombre" required maxLength={150} defaultValue={semillero?.nombre} className="campo" />
      </Campo>
      <Campo etiqueta="Descripción">
        <textarea name="descripcion" rows={4} maxLength={5000} defaultValue={semillero?.descripcion ?? ''} className="campo resize-y" />
      </Campo>
      <Campo etiqueta="Docente líder">
        <select name="lider_id" defaultValue={semillero?.liderId ?? ''} className="campo">
          <option value="">Sin asignar</option>
          {usuarios.filter((u) => u.activo).map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>
      </Campo>
      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="mb-1 font-semibold">Docentes asignados <span className="font-normal text-muted-text">(pueden proponer proyectos y subir PDFs aquí)</span></legend>
        {docentes.length === 0 && <span className="text-muted-text">No hay docentes activos. Créalos en Usuarios.</span>}
        <div className="grid gap-1.5 sm:grid-cols-2">
          {docentes.map((u) => (
            <label key={u.id} className="flex items-center gap-2">
              <input type="checkbox" name="docentes[]" value={u.id} defaultChecked={semillero?.docentes.includes(u.id)} className="size-4 accent-[var(--color-primary-dark)]" />
              {u.nombre}
            </label>
          ))}
        </div>
      </fieldset>
      <CampoArchivo nombre="imagen" etiqueta="Imagen" tipo="imagen" actual={semillero?.imagen} onQuitar={setQuitarImagen} />
      <Interruptor activo={activo} onCambio={setActivo} etiqueta={activo ? 'Activo: se muestra en el sitio' : 'Inactivo: oculto en el sitio'} />
      {error && <Aviso>{error}</Aviso>}
      <button type="submit" disabled={enviando} className="btn-primario self-start disabled:opacity-60">{enviando ? 'Guardando…' : 'Guardar'}</button>
    </form>
  )
}
