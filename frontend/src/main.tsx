import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router'
import './index.css'
import Layout from './components/Layout'
import Inicio from './pages/Inicio'
import Sensaciones from './pages/Sensaciones'
import PaginaInstitucional from './pages/PaginaInstitucional'
import Calendario from './pages/Calendario'
import Exalumnos from './pages/Exalumnos'
import PortalDocente from './pages/PortalDocente'
import Admin from './pages/Admin'
import NoEncontrada from './pages/NoEncontrada'

// Abierto con doble clic (file://) se navega con #/ruta; en el hosting, con URLs limpias (/ruta).
const Router = location.protocol === 'file:' ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="sensaciones" element={<Sensaciones />} />
          <Route path="institucional/calendario" element={<Calendario />} />
          <Route path="institucional/:seccion?" element={<PaginaInstitucional />} />
          <Route path="sedes" element={<PaginaInstitucional fija="sedes" />} />
          <Route path="proyectos" element={<PaginaInstitucional fija="proyectos" />} />
          <Route path="exalumnos" element={<Exalumnos />} />
          <Route path="portal" element={<PortalDocente />} />
          <Route path="admin" element={<Admin />} />
          <Route path="*" element={<NoEncontrada />} />
        </Route>
      </Routes>
    </Router>
  </StrictMode>,
)
