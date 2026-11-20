// Cliente de la API del Portal Docente (PHP en /api).
// Guarda el token CSRF que entrega el servidor y lo manda en cada petición que cambia datos.

export const SIN_SERVIDOR = location.protocol === 'file:'

export class ErrorApi extends Error {
  constructor(
    mensaje: string,
    public estado: number,
    public campo?: string,
    public codigo?: string,
  ) {
    super(mensaje)
  }
}

let csrf = ''
export const fijarCsrf = (t: string | undefined) => {
  if (t) csrf = t
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'DELETE'

async function pedir<T>(metodo: Metodo, ruta: string, cuerpo?: unknown, reintento = true): Promise<T> {
  if (SIN_SERVIDOR) {
    throw new ErrorApi('El portal necesita el servidor del sitio. Ábrelo desde el hosting o con el servidor local.', 0)
  }
  const esFormulario = cuerpo instanceof FormData
  let res: Response
  try {
    res = await fetch(`api${ruta}`, {
      method: metodo,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(metodo !== 'GET' ? { 'X-CSRF-Token': csrf } : {}),
        ...(cuerpo !== undefined && !esFormulario ? { 'Content-Type': 'application/json' } : {}),
      },
      body: cuerpo === undefined ? undefined : esFormulario ? cuerpo : JSON.stringify(cuerpo),
    })
  } catch {
    throw new ErrorApi('No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.', 0)
  }

  let datos: Record<string, unknown> = {}
  try {
    datos = await res.json()
  } catch {
    // respuesta sin JSON (por ejemplo, un error del hosting)
  }

  // Token CSRF vencido: se pide uno nuevo y se reintenta una vez.
  if (res.status === 419 && reintento) {
    const s = await pedir<{ csrf: string }>('GET', '/sesion', undefined, false)
    fijarCsrf(s.csrf)
    return pedir<T>(metodo, ruta, cuerpo, false)
  }
  if (!res.ok) {
    const mensaje = typeof datos.error === 'string' ? datos.error : `Error del servidor (${res.status}).`
    throw new ErrorApi(mensaje, res.status, datos.campo as string | undefined, datos.codigo as string | undefined)
  }
  fijarCsrf(datos.csrf as string | undefined)
  return datos as T
}

export const api = {
  get: <T>(ruta: string) => pedir<T>('GET', ruta),
  post: <T>(ruta: string, cuerpo?: unknown) => pedir<T>('POST', ruta, cuerpo ?? {}),
  put: <T>(ruta: string, cuerpo?: unknown) => pedir<T>('PUT', ruta, cuerpo ?? {}),
  delete: <T>(ruta: string) => pedir<T>('DELETE', ruta),
}

export const mensajeDeError = (e: unknown) => (e instanceof Error ? e.message : 'Ocurrió un error inesperado.')
