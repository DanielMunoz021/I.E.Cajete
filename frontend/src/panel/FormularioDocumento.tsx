import { useState, type FormEvent } from 'react'
import { api, mensajeDeError } from '../lib/api'
import { Aviso, Campo, CampoArchivo } from './ui'
import type { DocumentoAdmin } from './tipos'

type Opcion = { id: number; nombre: string }
type OpcionProyecto = { id: number; titulo: string; semilleroId: number }

// Formulario de PDF. Pertenece a un semillero o a uno de sus proyectos.
export default function FormularioDocumento({ documento, semilleros, proyectos, onGuardado, textoBoton = 'Guardar' }: {
  documento: DocumentoAdmin | null
  semilleros: Opcion[]
  proyectos: OpcionProyecto[]
  onGuardado: () => void
  textoBoton?: string
}) {
  const semilleroInicial = documento?.semilleroId ?? proyectos.find((p) => p.id === documento?.proyectoId)?.semilleroId ?? (semilleros.length === 1 ? semilleros[0].id : 0)
  const [semillero, setSemillero] = useState<number>(semilleroInicial)
  const [proyecto, setProyecto] = useState<number>(documento?.proyectoId ?? 0)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const proyectosDelSemillero = proyectos.filter((p) => p.semilleroId === semillero)

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.delete('semillero_id')
    fd.delete('proyecto_id')
    if (proyecto) fd.set('proyecto_id', String(proyecto))
    else fd.set('semillero_id', String(semillero))
    setEnviando(true)
    setError('')
    try {
      await api.post(documento ? `/documentos/${documento.id}` : '/documentos', fd)
      onGuardado()
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Semillero">
          <select required value={semillero || ''} onChange={(e) => { setSemillero(Number(e.target.value)); setProyecto(0) }} className="campo">
            <option value="" disabled>Elige un semillero</option>
            {semilleros.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Proyecto (opcional)">
          <select value={proyecto || ''} onChange={(e) => setProyecto(Number(e.target.value))} className="campo" disabled={!semillero}>
            <option value="">Del semillero en general</option>
            {proyectosDelSemillero.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}
          </select>
        </Campo>
      </div>
      <Campo etiqueta="Título del documento" ayuda="Por ejemplo: Informe final, Artículo, Póster de la feria.">
        <input name="titulo" required maxLength={200} defaultValue={documento?.titulo} className="campo" />
      </Campo>
      <Campo etiqueta="Descripción">
        <textarea name="descripcion" rows={3} maxLength={3000} defaultValue={documento?.descripcion ?? ''} className="campo resize-y" />
      </Campo>
      <Campo etiqueta="Fecha">
        <input name="fecha" type="date" defaultValue={documento?.fecha ?? new Date().toISOString().slice(0, 10)} className="campo" />
      </Campo>
      <CampoArchivo
        nombre="pdf"
        etiqueta={documento ? 'Reemplazar el PDF (opcional)' : 'Archivo PDF'}
        tipo="pdf"
        actual={documento?.url}
        requerido={!documento}
      />
      {error && <Aviso>{error}</Aviso>}
      <button type="submit" disabled={enviando} className="btn-primario self-start disabled:opacity-60">{enviando ? 'Subiendo…' : textoBoton}</button>
    </form>
  )
}
