import { TituloPanel } from './ui'

// Secciones del panel que llegan en las siguientes fases.
export default function Proximamente({ titulo, fase }: { titulo: string; fase: string }) {
  return (
    <>
      <TituloPanel titulo={titulo} />
      <p className="max-w-xl rounded-[var(--radius-card)] border-2 border-dashed border-line bg-white p-6 text-body">
        Esta sección se construye en la fase {fase} del portal.
      </p>
    </>
  )
}
