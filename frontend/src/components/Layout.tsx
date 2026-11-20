import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import Header from './Header'
import Footer from './Footer'
import { irAlContenido } from '../lib/navegacion'

export default function Layout() {
  const { pathname } = useLocation()

  // Al cambiar de página, volver arriba.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <button
        type="button"
        onClick={irAlContenido}
        className="sr-only z-50 rounded-lg bg-primary-dark px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </button>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
