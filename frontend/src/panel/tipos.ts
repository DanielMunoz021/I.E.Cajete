// Tipos de datos que entrega la API del panel.
import type { Revision } from './ui'
import type { Rol } from '../lib/sesion'

export type UsuarioLista = { id: number; nombre: string; correo: string; rol: Rol; activo: boolean }

export type SemilleroAdmin = {
  id: number
  nombre: string
  slug: string
  descripcion: string | null
  lider: string | null
  liderId: number | null
  imagen: string | null
  activo: boolean
  docentes: number[]
  proyectos: number
  destacado: boolean
}

export type ProyectoAdmin = {
  id: number
  semilleroId: number
  semillero: string
  titulo: string
  slug: string
  resumen: string | null
  integrantes: string[]
  anio: number | null
  imagen: string | null
  estado: 'en_curso' | 'finalizado'
  revision: Revision
  comentarioRevision: string | null
  enviadoPor: string | null
  enviadoPorId: number | null
  creadoEn: string
  destacado: boolean
}

export type DocumentoAdmin = {
  id: number
  titulo: string
  descripcion: string | null
  fecha: string | null
  url: string
  tamano: number | null
  semilleroId: number | null
  proyectoId: number | null
  padre: string | null
  revision: Revision
  comentarioRevision: string | null
  enviadoPor: string | null
  enviadoPorId: number | null
  nombreOriginal: string | null
  creadoEn: string
  destacado: boolean
}

export const tamanoLegible = (b: number | null) => (b == null ? '' : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)
