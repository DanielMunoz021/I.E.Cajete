# CLAUDE.md — Sitio web IE Cajete

Nuevo sitio de la Institución Educativa Cajete (iecajete.edu.co), Popayán, Cauca. Reemplaza al WordPress actual.
Todo el contenido y los comentarios van en español.

## Stack
- `frontend/`: React 19 + Vite + TypeScript + Tailwind CSS 4 + React Router + lucide-react.
  `npm run dev` para desarrollo; `npm run build` genera `sitio/` (en la raíz del proyecto):
  - `sitio/index.html` se abre con doble clic, sin servidor: `scripts/incrustar.mjs` mete el JS y el CSS dentro del HTML
    y el router usa `#/ruta` cuando la página viene de `file://`.
  - el contenido de `sitio/` (incluido `.htaccess`) se sube tal cual a `public_html/`; allí el router usa URLs limpias.
- Rutas de imágenes y PDF siempre relativas (`img/...`, `docs/...`, sin `/` inicial). En el hosting, el `<base href="/">`
  que pone `index.html` las resuelve desde la raíz.
- No usar enlaces `#id` para saltar dentro de la página (chocan con `#/ruta`): usar `lib/navegacion.ts`.
- `frontend/public/.htaccess`: HTTPS forzado + fallback de la SPA, excepto `/api` y archivos reales.
- Pendiente: API en PHP 8.3/8.4 sin framework (`api/`, PDO + JSON) y MariaDB 10.11 (`database/schema.sql`).
- Hosting: GoDaddy Economy compartido (Apache, 512 MB RAM, sin Node en el servidor).

## Reglas
- El contenido está en `frontend/src/data/sitio.ts` (general, menú, Sensaciones) y `frontend/src/data/institucional.ts`
  (misión, visión, sedes, docentes, directivos…, tomado del sitio anterior el 11/11/2026). No inventes datos institucionales: lo que falte va como `null` o `[VALIDAR]`.
- Colores: solo los tokens de `frontend/src/index.css` (paleta del escudo). Texto blanco solo sobre `primary-dark` (#007A52);
  amarillo y celeste solo como fondo de etiquetas con texto oscuro.
- Encabezado = el del sitio anterior: franja amarilla (`topbar`) con contacto y barra blanca con logo + menú en mayúsculas (Montserrat).
- Menú: Inicio · Institucional ▾ · Sedes (`/sedes`) · Sensaciones · Proyectos · Exalumnos · Portal docente. No hay Noticias, Eventos ni página de Contacto:
  el contacto está en el pie de página (`id="contacto"`) y los enlaces `#contacto` bajan hasta él.
- Sensaciones es el magazine escolar y tiene página propia; sus ediciones están en `EDICIONES`.
- Portal docente: solo sube PDF investigativos; quedan "pendiente" hasta que el admin aprueba. Hoy es una demo
  (`frontend/src/lib/demo.ts`, localStorage); se reemplazará por la API.
- Imágenes: `alt` en español, `width`/`height` reales, `loading="lazy"` fuera de la primera pantalla. Fotos con rostros de
  estudiantes solo con autorización de los acudientes.
