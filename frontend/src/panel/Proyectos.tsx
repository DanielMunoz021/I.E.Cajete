import { useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { api, mensajeDeError } from '../lib/api'
import { Aviso, BotonEliminar, Cargando, ChipRevision, Modal, TituloPanel, useDatos } from './ui'
import type { ProyectoAdmin, SemilleroAdmin } from './tipos'
import FormularioProyecto from './FormularioProyecto'
import InterruptorDestacado from './InterruptorDestacado'

export default function Proyectos() {
  const { datos, error, recargar } = useDatos<{ proyectos: ProyectoAdmin[] }>('/admin/proyectos')
  const { datos: sem } = useDatos<{ semilleros: SemilleroAdmin[] }>('/admin/semilleros')
  const [editando, setEditando] = useState<ProyectoAdmin | 'nuevo' | null>(null)
  const [filtro, setFiltro] = useState(0)
  const [aviso, setAviso] = useState('')
  const semilleros = sem?.semilleros ?? []
  const lista = (datos?.proyectos ?? []).filter((p) => !filtro || p.semilleroId === filtro)

  return (
    <>
      <TituloPanel
        titulo="Proyectos"
        descripcion="Proyectos de los semilleros. Los que crea la administración se publican de inmediato; los de docentes llegan a Pendientes."
        acciones={<button type="button" className="btn-primario" disabled={!semilleros.length} onClick={() => setEditando('nuevo')}><Plus size={18} aria-hidden="true" /> Nuevo proyecto</button>}
      />
      {!semilleros.length && sem && <div className="mb-5"><Aviso tipo="info">Primero crea un semillero.</Aviso></div>}
      {(error || aviso) && <div className="mb-5"><Aviso>{error || aviso}</Aviso></div>}
      <label className="mb-5 flex max-w-xs flex-col gap-1.5 text-sm font-semibold">
        Filtrar por semillero
        <select value={filtro} onChange={(e) => setFiltro(Number(e.target.value))} className="campo">
          <option value={0}>Todos</option>
          {semilleros.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      </label>
      {!datos && !error && <Cargando />}
      {datos && (
        <div className="tarjeta overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line bg-yellow-soft text-xs tracking-wide text-muted-text uppercase">
              <tr>
                <th scope="col" className="px-5 py-3">Proyecto</th>
                <th scope="col" className="px-5 py-3">Semillero</th>
                <th scope="col" className="px-5 py-3">Año</th>
                <th scope="col" className="px-5 py-3">Estado</th>
                <th scope="col" className="px-5 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-text">No hay proyectos.</td></tr>}
              {lista.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3.5">
                    <span className="block font-semibold">{p.titulo}</span>
                    <span className="text-muted-text">{p.estado === 'finalizado' ? 'Finalizado' : 'En curso'}{p.enviadoPor && ` · enviado por ${p.enviadoPor}`}</span>
                  </td>
                  <td className="px-5 py-3.5">{p.semillero}</td>
                  <td className="px-5 py-3.5">{p.anio ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col items-start gap-2">
                      <ChipRevision revision={p.revision} />
                      {p.revision === 'aprobado' && <InterruptorDestacado tipo="proyecto" id={p.id} activo={p.destacado} />}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditando(p)} className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-line px-3 py-2 font-semibold hover:border-primary-dark" aria-label={`Editar ${p.titulo}`}>
                        <Pencil size={15} aria-hidden="true" /> Editar
                      </button>
                      <BotonEliminar
                        etiqueta={`Eliminar ${p.titulo}`}
                        confirmar={`¿Eliminar "${p.titulo}" y todos sus PDFs?`}
                        onEliminar={async () => { try { await api.delete(`/proyectos/${p.id}`); recargar() } catch (e) { setAviso(mensajeDeError(e)) } }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal abierto={!!editando} titulo={editando === 'nuevo' ? 'Nuevo proyecto' : 'Editar proyecto'} onCerrar={() => setEditando(null)}>
        {editando && (
          <FormularioProyecto
            proyecto={editando === 'nuevo' ? null : editando}
            semilleros={semilleros}
            onGuardado={() => { setEditando(null); recargar() }}
          />
        )}
      </Modal>
    </>
  )
}
