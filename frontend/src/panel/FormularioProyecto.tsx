import { useState, type FormEvent } from 'react'
import { api, mensajeDeError } from '../lib/api'
import { Aviso, Campo, CampoArchivo } from './ui'
import type { ProyectoAdmin } from './tipos'

// Formulario de proyecto. Lo usan el admin (queda publicado) y el docente (queda pendiente).
export default function FormularioProyecto({ proyecto, semilleros, onGuardado, textoBoton = 'Guardar' }: {
  proyecto: ProyectoAdmin | null
  semilleros: { id: number; nombre: string }[]
  onGuardado: () => void
  textoBoton?: string
}) {
  const [quitarImagen, setQuitarImagen] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (quitarImagen) fd.set('quitar_imagen', '1')
    setEnviando(true)
    setError('')
    try {
      await api.post(proyecto ? `/proyectos/${proyecto.id}` : '/proyectos', fd)
      onGuardado()
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <Campo etiqueta="Semillero">
        <select name="semillero_id" required defaultValue={proyecto?.semilleroId ?? (semilleros.length === 1 ? semilleros[0].id : '')} className="campo">
          <option value="" disabled>Elige un semillero</option>
          {semilleros.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      </Campo>
      <Campo etiqueta="Título del proyecto">
        <input name="titulo" required maxLength={200} defaultValue={proyecto?.titulo} className="campo" />
      </Campo>
      <Campo etiqueta="Resumen">
        <textarea name="resumen" rows={4} maxLength={5000} defaultValue={proyecto?.resumen ?? ''} className="campo resize-y" />
      </Campo>
      <Campo etiqueta="Integrantes" ayuda="Uno por línea.">
        <textarea name="integrantes" rows={3} maxLength={3000} defaultValue={proyecto?.integrantes.join('\n') ?? ''} className="campo resize-y" />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Año">
          <input name="anio" type="number" min={1990} max={2100} defaultValue={proyecto?.anio ?? new Date().getFullYear()} className="campo" />
        </Campo>
        <Campo etiqueta="Estado">
          <select name="estado" defaultValue={proyecto?.estado ?? 'en_curso'} className="campo">
            <option value="en_curso">En curso</option>
            <option value="finalizado">Finalizado</option>
          </select>
        </Campo>
      </div>
      <CampoArchivo nombre="imagen" etiqueta="Imagen (opcional)" tipo="imagen" actual={proyecto?.imagen} onQuitar={setQuitarImagen} />
      {error && <Aviso>{error}</Aviso>}
      <button type="submit" disabled={enviando} className="btn-primario self-start disabled:opacity-60">{enviando ? 'Guardando…' : textoBoton}</button>
    </form>
  )
}
