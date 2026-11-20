import { useState } from 'react'
import { FolderPlus, Sprout, Upload } from 'lucide-react'
import { Aviso, Cargando, Modal, TituloPanel, useDatos, type Revision } from './ui'
import FormularioProyecto from './FormularioProyecto'
import FormularioDocumento from './FormularioDocumento'

type MiSemillero = {
  id: number
  nombre: string
  slug: string
  descripcion: string | null
  lider: string | null
  imagen: string | null
  activo: boolean
  proyectos: { id: number; titulo: string; revision: Revision; semilleroId: number }[]
}

// Vista del docente: sus semilleros asignados, para proponer proyectos y subir PDFs.
export default function MisSemilleros() {
  const { datos, error } = useDatos<{ semilleros: MiSemillero[] }>('/mis/semilleros')
  const [accion, setAccion] = useState<{ tipo: 'proyecto' | 'pdf'; semillero: MiSemillero } | null>(null)
  const [ok, setOk] = useState('')

  return (
    <>
      <TituloPanel titulo="Mis semilleros" descripcion="Propón proyectos y sube los PDFs de tus semilleros. Todo queda pendiente hasta que la administración lo apruebe." />
      {ok && <div className="mb-5"><Aviso tipo="ok">{ok}</Aviso></div>}
      {error && <Aviso>{error}</Aviso>}
      {!datos && !error && <Cargando />}
      {datos?.semilleros.length === 0 && (
        <p className="rounded-[var(--radius-card)] border-2 border-dashed border-line bg-white p-8 text-muted-text">Todavía no tienes semilleros asignados. Pídele a la administración que te asigne.</p>
      )}
      <ul className="grid gap-5 lg:grid-cols-2">
        {datos?.semilleros.map((s) => (
          <li key={s.id} className="tarjeta flex flex-col overflow-hidden">
            {s.imagen ? <img src={s.imagen} alt="" className="h-36 w-full object-cover" /> : <span className="flex h-24 items-center justify-center bg-primary-soft text-primary-dark"><Sprout size={36} aria-hidden="true" /></span>}
            <div className="flex flex-1 flex-col gap-3 p-6">
              <h2 className="font-display text-2xl">{s.nombre}</h2>
              {s.descripcion && <p className="line-clamp-3 text-body">{s.descripcion}</p>}
              <p className="text-sm text-muted-text">
                {s.proyectos.length ? `Proyectos: ${s.proyectos.map((p) => p.titulo + (p.revision !== 'aprobado' ? ` (${p.revision})` : '')).join(', ')}` : 'Aún no tiene proyectos.'}
              </p>
              <div className="mt-auto flex flex-wrap gap-3 pt-2">
                <button type="button" className="btn-primario" onClick={() => setAccion({ tipo: 'proyecto', semillero: s })}><FolderPlus size={18} aria-hidden="true" /> Proponer proyecto</button>
                <button type="button" className="btn-amarillo" onClick={() => setAccion({ tipo: 'pdf', semillero: s })}><Upload size={18} aria-hidden="true" /> Subir PDF</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Modal abierto={!!accion} titulo={accion?.tipo === 'proyecto' ? `Proponer proyecto · ${accion.semillero.nombre}` : `Subir PDF · ${accion?.semillero.nombre ?? ''}`} onCerrar={() => setAccion(null)}>
        {accion?.tipo === 'proyecto' && (
          <FormularioProyecto
            proyecto={null}
            semilleros={[accion.semillero]}
            textoBoton="Enviar a revisión"
            onGuardado={() => { setAccion(null); setOk('Proyecto enviado. Quedó pendiente de aprobación: míralo en «Mis envíos».') }}
          />
        )}
        {accion?.tipo === 'pdf' && (
          <FormularioDocumento
            documento={null}
            semilleros={[accion.semillero]}
            proyectos={accion.semillero.proyectos}
            textoBoton="Enviar a revisión"
            onGuardado={() => { setAccion(null); setOk('PDF enviado. Quedó pendiente de aprobación: míralo en «Mis envíos».') }}
          />
        )}
      </Modal>
    </>
  )
}
