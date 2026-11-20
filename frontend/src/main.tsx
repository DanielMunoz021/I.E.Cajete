import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router'
import './index.css'
import Layout from './components/Layout'
import Inicio from './pages/Inicio'
import Sensaciones from './pages/Sensaciones'
import PaginaInstitucional from './pages/PaginaInstitucional'
import Calendario from './pages/Calendario'
import Exalumnos from './pages/Exalumnos'
import Ingreso from './pages/Ingreso'
import NoEncontrada from './pages/NoEncontrada'
import { SesionProvider } from './lib/sesion'
import PanelLayout from './panel/PanelLayout'
import Dashboard from './panel/Dashboard'
import Usuarios from './panel/Usuarios'
import CambiarClave from './panel/CambiarClave'
import Proximamente from './panel/Proximamente'
import Semilleros from './panel/Semilleros'
import Proyectos from './panel/Proyectos'
import Documentos from './panel/Documentos'
import SensacionesAdmin from './panel/SensacionesAdmin'
import Destacados from './panel/Destacados'
import SemillerosPublico from './pages/Semilleros'
import SemilleroDetalle from './pages/SemilleroDetalle'

// Abierto con doble clic (file://) se navega con #/ruta; en el hosting, con URLs limpias (/ruta).
const Router = location.protocol === 'file:' ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <SesionProvider>
        <Routes>
          {/* Sitio público */}
          <Route element={<Layout />}>
            <Route index element={<Inicio />} />
            <Route path="sensaciones" element={<Sensaciones />} />
            <Route path="institucional/calendario" element={<Calendario />} />
            <Route path="institucional/:seccion?" element={<PaginaInstitucional />} />
            <Route path="sedes" element={<PaginaInstitucional fija="sedes" />} />
            <Route path="semilleros" element={<SemillerosPublico />} />
            <Route path="semilleros/:slug" element={<SemilleroDetalle />} />
            <Route path="proyectos" element={<Navigate to="/semilleros" replace />} />
            <Route path="exalumnos" element={<Exalumnos />} />
            <Route path="portal" element={<Ingreso />} />
            <Route path="*" element={<NoEncontrada />} />
          </Route>

          {/* Panel (admin y docentes). Cada acción la vuelve a autorizar el servidor. */}
          <Route path="admin" element={<PanelLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="mi-clave" element={<CambiarClave />} />
            <Route path="semilleros" element={<Semilleros />} />
            <Route path="proyectos" element={<Proyectos />} />
            <Route path="documentos" element={<Documentos />} />
            <Route path="sensaciones" element={<SensacionesAdmin />} />
            <Route path="destacados" element={<Destacados />} />
            <Route path="pendientes" element={<Proximamente titulo="Pendientes" fase="(e)" />} />
            <Route path="mis-semilleros" element={<Proximamente titulo="Mis semilleros" fase="(e)" />} />
            <Route path="mis-envios" element={<Proximamente titulo="Mis envíos" fase="(e)" />} />
            <Route path="*" element={<Proximamente titulo="Sección no encontrada" fase="—" />} />
          </Route>
        </Routes>
      </SesionProvider>
    </Router>
  </StrictMode>,
)
