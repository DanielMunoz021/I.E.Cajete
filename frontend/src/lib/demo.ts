// Almacén de DEMOSTRACIÓN para el portal docente y el panel admin.
// Guarda en localStorage del navegador; se reemplazará por la API en PHP (public_html/api/).
import { useSyncExternalStore } from 'react'

export type Estado = 'pendiente' | 'aprobada' | 'rechazada'

export type Publicacion = {
  id: string
  titulo: string
  semillero: string
  resumen: string
  archivo: string
  docente: string
  fecha: string
  estado: Estado
  motivo?: string
}

const CLAVE = 'iecajete-demo-publicaciones'
const oyentes = new Set<() => void>()

function leer(): Publicacion[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? '[]') as Publicacion[]
  } catch {
    return []
  }
}

let cache = leer()

function guardar(lista: Publicacion[]) {
  cache = lista
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista))
  } catch {
    // Sin almacenamiento (modo privado): la demo sigue funcionando en memoria.
  }
  oyentes.forEach((f) => f())
}

export function usePublicaciones() {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f)
      return () => oyentes.delete(f)
    },
    () => cache,
  )
}

export function crearPublicacion(p: Omit<Publicacion, 'id' | 'fecha' | 'estado'>) {
  guardar([{ ...p, id: crypto.randomUUID(), fecha: new Date().toISOString(), estado: 'pendiente' }, ...cache])
}

export function cambiarEstado(id: string, estado: Estado, motivo?: string) {
  guardar(cache.map((p) => (p.id === id ? { ...p, estado, motivo } : p)))
}

export const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
