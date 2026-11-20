// Ediciones de Sensaciones: desde la API (administrables). Si no hay servidor
// (sitio abierto con doble clic) se usan las ediciones fijas de data/sitio.ts.
import { useEffect, useState } from 'react'
import { api, SIN_SERVIDOR } from './api'
import { EDICIONES } from '../data/sitio'

export type EdicionSensaciones = {
  id: number
  numero: number
  titulo: string
  fecha: string | null
  fechaTexto: string
  descripcion: string | null
  portada: string | null
  pdf: string
}

type EdicionApi = Omit<EdicionSensaciones, 'fechaTexto'> & { fecha: string }

const mesAnio = (iso: string) => {
  const t = new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }).replace(' de ', ' ')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

const RESPALDO: EdicionSensaciones[] = EDICIONES.map((e) => ({
  id: e.numero,
  numero: e.numero,
  titulo: e.nombre,
  fecha: null,
  fechaTexto: e.fecha,
  descripcion: e.articulos.length ? `En esta edición: ${e.articulos.map((a) => `${a.titulo} (pág. ${a.pagina})`).join(' · ')}` : null,
  portada: e.portada,
  pdf: e.pdf,
}))

export function useEdiciones() {
  const [ediciones, setEdiciones] = useState<EdicionSensaciones[]>(SIN_SERVIDOR ? RESPALDO : [])
  const [cargando, setCargando] = useState(!SIN_SERVIDOR)

  useEffect(() => {
    if (SIN_SERVIDOR) return
    api
      .get<{ ediciones: EdicionApi[] }>('/publico/ediciones')
      .then((r) => setEdiciones(r.ediciones.map((e) => ({ ...e, fechaTexto: mesAnio(e.fecha) }))))
      .catch(() => setEdiciones(RESPALDO))
      .finally(() => setCargando(false))
  }, [])

  return { ediciones, cargando }
}
