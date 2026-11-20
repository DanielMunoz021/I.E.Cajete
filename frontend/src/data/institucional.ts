// Contenido institucional tomado del sitio actual (iecajete.edu.co), revisado el 11 de noviembre de 2026.
// Lo que el sitio actual no tiene va como null o con [VALIDAR] en la página.

export const FUNDACION = 1991

export const RESENA = [
  'La Institución Educativa Cajete fue creada en el año 1991.',
  'Ha seguido su funcionamiento en el mismo plantel. Por la gran cantidad de estudiantes, la Alcaldía del municipio de Popayán decidió construir un nuevo plantel, teniendo en cuenta a las personas que se forman en este colegio.',
]

export const MISION =
  'En cumplimiento de los fines y objetivos de la educación, promueve una formación integral a través de la adopción de estrategias pedagógicas activas y conceptuales, de la práctica de valores éticos y del mejoramiento continuo de sus procesos institucionales.'

export const VISION = {
  intro: 'Ser reconocida por:',
  puntos: [
    'Formar personas competentes, con un espíritu de superación personal, de liderazgo y servicio a la comunidad.',
    'Tener un modelo pedagógico y administrativo propio.',
  ],
}

export const OBJETIVOS = [
  'Cumplir con los fines y objetivos educativos planteados en la Ley General de Educación.',
  'Propender por la formación de personas íntegras, autónomas y tolerantes, conscientes de sus derechos y deberes como ciudadanos colombianos.',
  'Formar personas competentes, con herramientas personales e intelectuales que les permitan mejorar su nivel de vida y el de su entorno familiar.',
  'Formar personas con capacidad de liderazgo que les permita incidir positivamente en el mejoramiento de la calidad de vida de su comunidad.',
  'Fomentar la formulación de los proyectos de vida escolar, personal y laboral de sus educandos.',
  'Cualificar a los miembros de la comunidad educativa para que desde sus distintos roles puedan aportar al mejoramiento de la calidad del servicio educativo prestado por la institución.',
  'Mejorar continuamente los procesos institucionales con el propósito de cumplir plenamente con la misión institucional y lograr la visión y los perfiles propuestos.',
]

export const PEI_LEMA = 'Formamos humanos integrales comprometidos con su entorno, la paz y el desarrollo sostenible.'

export const NIVELES = [
  { nombre: 'Preescolar', lema: 'Desarrollo íntegro', texto: 'Desarrollo de habilidades socioafectivas. Motricidad y lenguaje mediante el juego.' },
  { nombre: 'Básica Primaria', lema: 'Raíces rurales', texto: 'Lectoescritura y trabajo colectivo. Reconocimiento del territorio rural.' },
  { nombre: 'Secundaria y Media', lema: 'Media académica', texto: 'Proyecto de vida y comunidad. Liderazgo para transformar.' },
]

export const DIRECTIVOS = [
  { nombre: 'Benjamín Bonilla', cargo: 'Rector' },
  { nombre: 'Sandra Patricia Ocaña', cargo: 'Coordinadora académica' },
  { nombre: 'Carlos Arbey Tosse', cargo: 'Coordinador de convivencia' },
  { nombre: 'Rider Valdiviezo', cargo: 'Coordinador de primaria' },
]

export const SEDE_CENTRAL = {
  nombre: 'Sede Central Cajete',
  descripcion: 'Institución educativa con enfoque rural.',
}

// Otras sedes (así aparecen en el sitio actual)
export const OTRAS_SEDES = ['Río Hondo', 'La Yunga', 'Las Chozas', 'Bajo Charco', 'El Tablón', 'El Charco']

export type Docente = { nombre: string; area: string; nivel: 'Preescolar' | 'Primaria' | 'Secundaria'; jornada: 'Mañana' | 'Tarde' }

// Docentes de la sede Cajete
export const DOCENTES: Docente[] = [
  { nombre: 'Evelin Ximena Achicanoy López', area: 'Preescolar', nivel: 'Preescolar', jornada: 'Mañana' },
  { nombre: 'Victoria Eugenia Flor Canencio', area: 'Preescolar', nivel: 'Preescolar', jornada: 'Mañana' },
  { nombre: 'Mónica Alexandra Bernal Freire', area: 'Primaria', nivel: 'Primaria', jornada: 'Mañana' },
  { nombre: 'Gloria Edilma Chamorro Toro', area: 'Primaria', nivel: 'Primaria', jornada: 'Mañana' },
  { nombre: 'Beatriz Juliana Cubides Burbano', area: 'Primaria', nivel: 'Primaria', jornada: 'Mañana' },
  { nombre: 'Edna Ipia Pardo', area: 'Primaria', nivel: 'Primaria', jornada: 'Mañana' },
  { nombre: 'Julieta Gigliola López Ordóñez', area: 'Primaria', nivel: 'Primaria', jornada: 'Mañana' },
  { nombre: 'Martha Cecilia Luna Paredes', area: 'Primaria', nivel: 'Primaria', jornada: 'Mañana' },
  { nombre: 'Floralba Leonor Caicedo Díaz', area: 'Educación artística', nivel: 'Secundaria', jornada: 'Tarde' },
  { nombre: 'María del Pilar Cárdenas Rodríguez', area: 'Idiomas', nivel: 'Secundaria', jornada: 'Tarde' },
  { nombre: 'Luis Antonio Córdoba Gómez', area: 'Ciencias sociales', nivel: 'Secundaria', jornada: 'Tarde' },
  { nombre: 'Edward Orlando Melenge Garzón', area: 'Ciencias sociales', nivel: 'Secundaria', jornada: 'Tarde' },
  { nombre: 'Alexander Cruz Escobar', area: 'Español', nivel: 'Secundaria', jornada: 'Tarde' },
  { nombre: 'Juan Carlos Diago Urrutia', area: 'Informática', nivel: 'Secundaria', jornada: 'Tarde' },
  { nombre: 'Claudia Janneth Dulce Barco', area: 'Educación física', nivel: 'Secundaria', jornada: 'Tarde' },
  { nombre: 'Paulo César Gamboa Marín', area: 'Ciencias naturales', nivel: 'Secundaria', jornada: 'Tarde' },
]

// Fotos del carrusel de portada del sitio actual (a.png, b.png, c.png), en su mejor resolución disponible.
export const FOTOS_PORTADA = [
  { src: 'img/hero-sede.jpg', alt: 'Pasillos y salones de la sede central de la Institución Educativa Cajete', ancho: 1536, alto: 1152 },
  { src: 'img/sede-cajete.jpg', alt: 'Estudiantes con trajes típicos frente a la sede central', ancho: 800, alto: 424 },
  { src: 'img/hero-entrega.jpg', alt: 'Directivos, docentes y autoridades en la entrega de la sede central', ancho: 1536, alto: 1152 },
]

// Bloques destacados del inicio del sitio actual.
export const DISTINTIVOS = [
  { titulo: 'Criterios y políticas institucionales', texto: 'Artículo 87 de la Ley 115 de 1994.' },
  { titulo: 'Niveles', texto: 'Preescolar, básica primaria, secundaria y media.' },
  { titulo: 'Libros y biblioteca', texto: 'Instalaciones académicas aptas para el conocimiento: un espacio para que la comunidad educativa explore sus intereses.' },
  { titulo: 'Educación certificada', texto: 'Modelo pedagógico y administrativo propio.' },
]

// Texto de la página de contacto del sitio actual.
export const CONTACTO_TEXTO = {
  titulo: '¡Agenda una visita!',
  texto: 'Comunícate con nosotros y nos pondremos en contacto contigo tan pronto como nos sea posible.',
  // Misma búsqueda del mapa que usa el sitio actual
  consultaMapa: 'INST.EDUCATIVA CAJETE, Popayán, Cauca, Colombia',
}

export const MANUAL = {
  fundamento: 'Artículo 87 de la Ley 115 de 1994 (Ley General de Educación).',
  lema: 'Conoce los valores que nos guían.',
  publicado: 'Publicado el 26 de marzo de 2026 para el año lectivo 2026.',
  pdf: null as string | null, // [VALIDAR] el sitio actual no enlaza el documento
}

export const PEI_PDF = null as string | null // [VALIDAR] el sitio actual no enlaza el documento

export const ESCUELA_PADRES =
  'Es una oportunidad para que los padres puedan tener herramientas clave para ayudar a sus hijos en tiempos modernos.'

export const EXALUMNOS = {
  titulo: 'Orgullo rural, compromiso permanente',
  texto:
    'Nuestros egresados son reflejo de una educación rural que forma personas íntegras, comprometidas con su territorio y con el desarrollo social.',
}

// Áreas que el sitio actual muestra en "Últimos proyectos" (sin material todavía)
export const AREAS_PROYECTOS = ['Inglés', 'Matemáticas', 'Informática']

export const ALIADOS = [
  { nombre: 'Ministerio de Educación Nacional', logo: 'img/aliados/mineducacion.png' },
  { nombre: 'Secretaría de Educación Municipal de Popayán', logo: 'img/aliados/secretaria-educacion-popayan.png' },
  { nombre: 'Alcaldía Municipal de Popayán', logo: 'img/aliados/alcaldia-popayan.png' },
]
