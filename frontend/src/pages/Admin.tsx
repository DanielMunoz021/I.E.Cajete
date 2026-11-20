import CabeceraPagina from '../components/CabeceraPagina'
import EstadoChip from '../components/EstadoChip'
import { cambiarEstado, fechaCorta, usePublicaciones } from '../lib/demo'

export default function Admin() {
  const publicaciones = usePublicaciones()
  const cuenta = (e: string) => publicaciones.filter((p) => p.estado === e).length

  const rechazar = (id: string) => {
    const motivo = window.prompt('Motivo del rechazo (lo verá el docente):') ?? undefined
    cambiarEstado(id, 'rechazada', motivo || undefined)
  }

  return (
    <>
      <CabeceraPagina antetitulo="Administración" titulo="Aprobaciones">
        PDFs investigativos enviados por docentes. Nada se publica sin tu aprobación.
      </CabeceraPagina>
      <div className="contenedor pt-6">
        <p className="rounded-lg bg-sky-soft px-4 py-3 text-sm text-sky-text">
          <strong>Demostración:</strong> sin inicio de sesión ni backend todavía. Ve lo que se envía desde el Portal docente en este navegador.
        </p>
      </div>
      <section className="contenedor py-10">
        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          {(['pendiente', 'aprobada', 'rechazada'] as const).map((e) => (
            <div key={e} className="tarjeta p-5">
              <span className="block font-display text-4xl">{cuenta(e)}</span>
              <span className="text-sm text-muted-text capitalize">{e}s</span>
            </div>
          ))}
        </div>

        <div className="tarjeta overflow-hidden">
          {publicaciones.length === 0 && <p className="p-7 text-muted-text">No hay envíos. Prueba subiendo un PDF desde el Portal docente.</p>}
          <ul>
            {publicaciones.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-4 border-b border-[#EEE] px-6 py-4 last:border-b-0">
                <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-0.5">
                  <span className="font-semibold">{p.titulo}</span>
                  <span className="text-[13px] text-muted-text">{p.docente} · {p.semillero} · {p.archivo} · {fechaCorta(p.fecha)}</span>
                </div>
                {p.estado === 'pendiente' ? (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => rechazar(p.id)} className="rounded-lg border-[1.5px] border-danger px-3.5 py-2 text-sm font-semibold text-danger hover:bg-danger-soft">Rechazar</button>
                    <button type="button" onClick={() => cambiarEstado(p.id, 'aprobada')} className="rounded-lg bg-primary-dark px-4 py-2 text-sm font-semibold text-white hover:bg-primary-darker">Aprobar</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <EstadoChip estado={p.estado} />
                    <button type="button" onClick={() => cambiarEstado(p.id, 'pendiente')} className="text-sm text-muted-text underline">Deshacer</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
