import { Link } from 'react-router'

export default function NoEncontrada() {
  return (
    <section className="contenedor flex flex-col items-center gap-4 py-24 text-center">
      <span className="font-display text-7xl text-primary-dark">404</span>
      <h1 className="text-3xl">No encontramos esta página</h1>
      <p className="text-body">Puede que el enlace haya cambiado con el nuevo sitio.</p>
      <Link to="/" className="btn-primario mt-2">Volver al inicio</Link>
    </section>
  )
}
