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
- Portal Docente: API JSON en PHP 8 puro + PDO. `api/` (va en public_html/api) solo incluye `privado/app.php`;
  la lógica, `config.php` y `uploads/` van en `privado/` (en el hosting, FUERA de public_html: iecajete-privado/).
  Rutas en `privado/app.php` → archivos de `privado/rutas/`. Esquema en `database/schema.sql`. Despliegue: README.md.
  - Toda consulta con `q()/fila()/filas()/valor()` (preparadas). Toda ruta que cambia datos ya pasa por `verificar_csrf()`.
  - Cada ruta empieza con `requerir_login()` o `requerir_admin()`: el permiso se verifica en el servidor, no en la pantalla.
  - Frontend del panel en `frontend/src/panel/` (cliente en `lib/api.ts`, sesión en `lib/sesion.tsx`).
  - Local: `herramientas\preparar-local.ps1` (una vez) e `iniciar-local.ps1`. Demo: `php herramientas\cargar-demo.php --borrar-datos-locales`.
    Pruebas: `php pruebas\fase-{a..e}.php --borrar-datos-locales` (124 pruebas; vacían la base local). Si agregas una ruta, agrégale pruebas.
  - Archivos subidos: solo con `guardar_subida()` (valida extensión + MIME con finfo) y se sirven por `GET /api/archivo/{id}`.
  - Contenido de docentes: entra `pendiente` (`revision_inicial()`); lo público filtra `revision = 'aprobado'`. Al borrar algo, `quitar_destacado()`.
  - Con PDO sin emulación no se puede repetir un parámetro con nombre (`:a` dos veces): usa `?` repetidos.
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
- Roles: admin (todo) y docente (sube PDFs y propone proyectos en sus semilleros asignados; queda "pendiente" hasta que
  el admin aprueba o rechaza con comentario). No hay registro público: el admin crea las cuentas con clave temporal.
- Imágenes: `alt` en español, `width`/`height` reales, `loading="lazy"` fuera de la primera pantalla. Fotos con rostros de
  estudiantes solo con autorización de los acudientes.
