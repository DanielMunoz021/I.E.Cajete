// Contenido del sitio en un solo lugar (el institucional está en institucional.ts).
// Lo que todavía no ha confirmado la institución va como null o con el texto [VALIDAR].
import { FUNDACION, OTRAS_SEDES } from './institucional'

export const INSTITUCION = {
  nombre: 'Institución Educativa Cajete',
  lema: 'Ciencia · Trabajo · Virtud · Progreso',
  ciudad: 'Popayán, Cauca - Colombia',
  direccion: 'Vereda Cajete, vía al Tambo km 6',
  telefono: null as string | null, // [VALIDAR] el sitio anterior tenía un número de ejemplo
  correo: 'iecajetepopayan@iecajete.com', // [VALIDAR] el dominio real es .edu.co
  redes: [] as { nombre: string; url: string }[], // [VALIDAR] qué redes tiene la institución
}

// Cifras de la franja de inicio, calculadas con los datos del sitio actual:
// fundada en 1991 y con 7 sedes (la central + 6).
export const CIFRAS: { valor: string | null; etiqueta: string }[] = [
  { valor: String(new Date().getFullYear() - FUNDACION), etiqueta: `Años de trayectoria (desde ${FUNDACION})` },
  { valor: String(1 + OTRAS_SEDES.length), etiqueta: 'Sedes' },
]

export type ItemMenu = { etiqueta: string; ruta: string; hijos?: ItemMenu[] }

// Mismo menú del sitio anterior, sin Noticias ni Eventos, con Sensaciones y con Portal docente en lugar de Contacto.
export const MENU: ItemMenu[] = [
  { etiqueta: 'Inicio', ruta: '/' },
  {
    etiqueta: 'Institucional',
    ruta: '/institucional',
    hijos: [
      { etiqueta: 'Misión y visión', ruta: '/institucional/mision-vision' },
      { etiqueta: 'Símbolos', ruta: '/institucional/simbolos' },
      { etiqueta: 'Reseña histórica', ruta: '/institucional/resena' },
      { etiqueta: 'PEI', ruta: '/institucional/pei' },
      { etiqueta: 'Manual de convivencia', ruta: '/institucional/manual-de-convivencia' },
      { etiqueta: 'Docentes por materia', ruta: '/institucional/docentes' },
      { etiqueta: 'Equipo directivo', ruta: '/institucional/administrativos' },
      { etiqueta: 'Calendario académico 2026', ruta: '/institucional/calendario' },
      { etiqueta: 'Esc. padres de familia', ruta: '/institucional/escuela-de-padres' },
    ],
  },
  { etiqueta: 'Sedes', ruta: '/sedes' },
  { etiqueta: 'Sensaciones', ruta: '/sensaciones' },
  { etiqueta: 'Semilleros', ruta: '/semilleros' },
  { etiqueta: 'Exalumnos', ruta: '/exalumnos' },
  { etiqueta: 'Portal docente', ruta: '/portal' },
]
// El contacto no va en el menú: está en el pie de página (id="contacto").

export type Edicion = {
  numero: number
  nombre: string
  fecha: string
  anio: number
  portada: string | null
  pdf: string
  articulos: { titulo: string; autor?: string; pagina: number }[]
}

// Ediciones de Sensaciones, de la más reciente a la más antigua (las dos que había en el sitio anterior).
// [VALIDAR] falta la segunda edición.
export const EDICIONES: Edicion[] = [
  {
    numero: 3,
    nombre: 'Tercera edición',
    fecha: 'Noviembre 2025',
    anio: 2025,
    portada: 'img/sensaciones-3-2025.jpg',
    pdf: 'docs/sensaciones-3-2025.pdf',
    articulos: [
      { titulo: 'Inteligencia artificial', autor: 'Juan Carlos Diago U.', pagina: 5 },
      { titulo: 'Función de las matemáticas', autor: 'Mati López', pagina: 8 },
      { titulo: 'Ciencia, arte, deporte y familia', pagina: 14 },
      { titulo: 'Class 2025: un nuevo capítulo', pagina: 16 },
    ],
  },
  {
    numero: 1,
    nombre: 'Primera edición',
    fecha: 'Mayo 2022',
    anio: 2022,
    portada: null,
    pdf: 'docs/sensaciones-1-2022.pdf',
    articulos: [],
  },
]

export const SENSACIONES_ESLOGAN = 'Donde las palabras inspiran, unen y transforman.'

// Texto de presentación del sitio anterior
export const SENSACIONES_INTRO = [
  'Los invitamos a leer, a sentir y a pensar Sensaciones, que hemos realizado con dedicación, responsabilidad y afecto por todos los integrantes de esta hermosa Institución Educativa Cajete.',
  'Nuestro objetivo es promover una cultura informativa y literaria que se publique de manera periódica, en digital o en físico. Te animamos a enviarnos tus textos, fotos, dibujos, poemas, cuentos y demás expresiones literarias y artísticas que sean publicables.',
]

export type Foto = { src: string; alt: string; ancho: number; alto: number }

export const GALERIA: Foto[] = [
  { src: 'img/galeria/capacitacion-prevencion.jpg', alt: 'Estudiantes en la capacitación en prevención del 24 de abril de 2026', ancho: 1600, alto: 720 },
  { src: 'img/galeria/actividad-patio.jpg', alt: 'Estudiantes de primaria haciendo una actividad en el patio', ancho: 768, alto: 672 },
  { src: 'img/galeria/tradiciones.jpg', alt: 'Estudiantes y docente en una muestra de tradiciones con una paila de cobre', ancho: 768, alto: 839 },
  { src: 'img/galeria/mural.jpg', alt: 'Docente con estudiantes frente a un mural decorado', ancho: 768, alto: 505 },
  { src: 'img/galeria/deporte.jpg', alt: 'Estudiantes jugando tenis de mesa en la sede', ancho: 768, alto: 648 },
  { src: 'img/galeria/preescolar.jpg', alt: 'Niñas de preescolar dibujando en el salón', ancho: 768, alto: 417 },
  { src: 'img/galeria/navidad.jpg', alt: 'Salón decorado para Navidad con trabajos de los estudiantes', ancho: 768, alto: 948 },
]
