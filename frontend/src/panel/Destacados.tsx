import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Star, X } from 'lucide-react'
import { api, mensajeDeError } from '../lib/api'
import { Aviso, Cargando, Interruptor, TituloPanel, useDatos } from './ui'

type Destacado = {
  id: number
  tipo: string
  orden: number
  fin: string | null
  activo: boolean
  titulo: string
  etiqueta: string
  imagen: string | null
  motivo: string | null
}

export default function Destacados() {
  const { datos, error, recargar } = useDatos<{ destacados: Destacado[] }>('/admin/destacados')
  const [lista, setLista] = useState<Destacado[]>([])
  const [aviso, setAviso] = useState('')

  useEffect(() => { if (datos) setLista(datos.destacados) }, [datos])

  const mover = async (i: number, delta: number) => {
    const nueva = [...lista]
    const j = i + delta
    if (j < 0 || j >= nueva.length) return
    ;[nueva[i], nueva[j]] = [nueva[j], nueva[i]]
    setLista(nueva)
    try {
      await api.post('/destacados/orden', { ids: nueva.map((d) => d.id) })
    } catch (e) {
      setAviso(mensajeDeError(e))
      recargar()
    }
  }

  const guardar = async (d: Destacado, cambios: Partial<Destacado>) => {
    const nuevo = { ...d, ...cambios }
    setLista((l) => l.map((x) => (x.id === d.id ? nuevo : x)))
    try {
      await api.put(`/destacados/${d.id}`, { orden: nuevo.orden, fin: nuevo.fin ?? '', activo: nuevo.activo })
      recargar()
    } catch (e) {
      setAviso(mensajeDeError(e))
      recargar()
    }
  }

  const quitar = async (d: Destacado) => {
    try {
      await api.delete(`/destacados/${d.id}`)
      recargar()
    } catch (e) {
      setAviso(mensajeDeError(e))
    }
  }

  return (
    <>
      <TituloPanel
        titulo="Destacados en inicio"
        descripcion="Lo que aparece en la sección de destacados de la página de inicio, en este orden. Para agregar algo, usa el botón ★ «Destacar en inicio» en Semilleros, Proyectos, Documentos o Sensaciones."
      />
      {(error || aviso) && <div className="mb-5"><Aviso>{error || aviso}</Aviso></div>}
      {!datos && !error && <Cargando />}
      {datos && lista.length === 0 && (
        <p className="flex items-center gap-3 rounded-[var(--radius-card)] border-2 border-dashed border-line bg-white p-8 text-muted-text">
          <Star aria-hidden="true" /> No hay destacados. La sección no se muestra en el inicio hasta que marques alguno.
        </p>
      )}
      <ol className="flex flex-col gap-3">
        {lista.map((d, i) => (
          <li key={d.id} className={`tarjeta flex flex-wrap items-center gap-4 p-4 ${d.motivo ? 'opacity-75' : ''}`}>
            <div className="flex flex-col">
              <button type="button" onClick={() => void mover(i, -1)} disabled={i === 0} aria-label={`Subir ${d.titulo}`} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ArrowUp size={18} /></button>
              <button type="button" onClick={() => void mover(i, 1)} disabled={i === lista.length - 1} aria-label={`Bajar ${d.titulo}`} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ArrowDown size={18} /></button>
            </div>
            <span className="font-display text-3xl text-primary-dark">{i + 1}</span>
            {d.imagen ? <img src={d.imagen} alt="" className="size-14 rounded-lg object-cover" /> : <span className="flex size-14 items-center justify-center rounded-lg bg-yellow-soft"><Star size={22} aria-hidden="true" /></span>}
            <div className="flex min-w-0 flex-[1_1_220px] flex-col">
              <span className="text-xs font-bold tracking-wide text-primary-dark uppercase">{d.etiqueta}</span>
              <span className="font-semibold">{d.titulo}</span>
              {d.motivo && <span className="text-sm font-semibold text-danger">No se ve en el inicio: {d.motivo}</span>}
            </div>
            <label className="flex flex-col gap-1 text-xs font-semibold text-muted-text">
              Mostrar hasta (opcional)
              <input type="date" value={d.fin ?? ''} onChange={(e) => void guardar(d, { fin: e.target.value || null })} className="campo py-2 text-sm" />
            </label>
            <Interruptor activo={d.activo} onCambio={(v) => void guardar(d, { activo: v })} etiqueta={d.activo ? 'Visible' : 'Pausado'} />
            <button type="button" onClick={() => void quitar(d)} aria-label={`Quitar ${d.titulo} de destacados`} className="flex size-10 items-center justify-center rounded-lg text-danger hover:bg-danger-soft"><X size={20} /></button>
          </li>
        ))}
      </ol>
    </>
  )
}
