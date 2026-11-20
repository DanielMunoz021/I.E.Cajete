import { useState, type FormEvent } from 'react'
import { FileText, Upload } from 'lucide-react'
import CabeceraPagina from '../components/CabeceraPagina'
import EstadoChip from '../components/EstadoChip'
import { crearPublicacion, fechaCorta, usePublicaciones } from '../lib/demo'

const TAMANO_MAX_MB = 10 // [VALIDAR] tamaño máximo con la institución (RT05)

export default function PortalDocente() {
  const [docente, setDocente] = useState<string | null>(null)

  return (
    <>
      <CabeceraPagina antetitulo="Acceso docentes" titulo="Portal docente">
        Sube tus trabajos investigativos en PDF. Se publican en Proyectos cuando el administrador los aprueba.
      </CabeceraPagina>
      <div className="contenedor pt-6">
        <p className="rounded-lg bg-sky-soft px-4 py-3 text-sm text-sky-text">
          <strong>Demostración:</strong> todavía no hay backend. Los datos se guardan solo en este navegador.
        </p>
      </div>
      {docente ? <Panel docente={docente} onSalir={() => setDocente(null)} /> : <Ingreso onEntrar={setDocente} />}
    </>
  )
}

function Ingreso({ onEntrar }: { onEntrar: (nombre: string) => void }) {
  const [correo, setCorreo] = useState('')

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    onEntrar(correo.split('@')[0] || 'Docente')
  }

  return (
    <section className="contenedor py-12">
      <form onSubmit={enviar} className="tarjeta mx-auto flex max-w-md flex-col gap-4 p-8">
        <h2 className="text-2xl">Ingresar</h2>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Correo institucional
          <input type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} className="campo" autoComplete="email" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Contraseña
          <input type="password" required className="campo" autoComplete="current-password" />
        </label>
        <button type="submit" className="btn-primario justify-center">Entrar</button>
      </form>
    </section>
  )
}

function Panel({ docente, onSalir }: { docente: string; onSalir: () => void }) {
  const todas = usePublicaciones()
  const mias = todas.filter((p) => p.docente === docente)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const datos = new FormData(form)
    const archivo = datos.get('archivo') as File | null
    setOk(false)
    if (!archivo || archivo.size === 0) return setError('Elige un archivo PDF.')
    if (archivo.type !== 'application/pdf') return setError('Solo se aceptan archivos PDF.')
    if (archivo.size > TAMANO_MAX_MB * 1024 * 1024) return setError(`El PDF supera ${TAMANO_MAX_MB} MB.`)
    setError('')
    crearPublicacion({
      titulo: String(datos.get('titulo')),
      semillero: String(datos.get('semillero')),
      resumen: String(datos.get('resumen')),
      archivo: archivo.name,
      docente,
    })
    form.reset()
    setOk(true)
  }

  return (
    <section className="contenedor flex flex-wrap items-start gap-7 py-10">
      <form onSubmit={enviar} className="tarjeta flex min-w-0 flex-[1_1_420px] flex-col gap-4 p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl">Subir PDF investigativo</h2>
          <button type="button" onClick={onSalir} className="text-sm text-muted-text underline">Cerrar sesión ({docente})</button>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Título del trabajo
          <input name="titulo" required className="campo" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Proyecto o semillero
          <input name="semillero" required className="campo" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Resumen
          <textarea name="resumen" rows={4} className="campo resize-y" />
        </label>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-primary bg-primary-soft/50 p-7 text-center">
          <Upload className="text-primary-dark" size={30} aria-hidden="true" />
          <span className="font-semibold text-primary-dark">Elige el PDF</span>
          <span className="text-sm text-muted-text">Solo PDF · máximo {TAMANO_MAX_MB} MB</span>
          <input name="archivo" type="file" accept="application/pdf" className="mt-1 max-w-full text-sm" />
        </label>
        {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
        {ok && <p role="status" className="text-sm font-semibold text-primary-darker">Enviado. Quedó pendiente de aprobación.</p>}
        <button type="submit" className="btn-primario self-start">Enviar a revisión</button>
      </form>

      <div className="tarjeta min-w-0 flex-[1_1_480px] p-7">
        <h2 className="mb-4 text-2xl">Mis publicaciones</h2>
        {mias.length === 0 && <p className="text-muted-text">Todavía no has enviado trabajos.</p>}
        <ul className="flex flex-col gap-3">
          {mias.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3.5 rounded-xl border border-[#EEE] p-4">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary-dark">
                <FileText size={20} aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-[1_1_200px] flex-col">
                <span className="font-semibold">{p.titulo}</span>
                <span className="text-[13px] text-muted-text">{p.semillero} · {fechaCorta(p.fecha)}</span>
                {p.motivo && <span className="text-[13px] text-danger">Motivo: {p.motivo}</span>}
              </div>
              <EstadoChip estado={p.estado} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
