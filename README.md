# Sitio web y Portal Docente — I.E. Cajete

Sitio institucional de la Institución Educativa Cajete (iecajete.edu.co) con un **Portal Docente** y un **panel de administración** para gestionar usuarios, semilleros, proyectos, PDFs, el magazine *Sensaciones* y los destacados del inicio.

## Arquitectura

| Parte | Tecnología | En el hosting va en |
|---|---|---|
| Sitio público, portal y panel (`frontend/`) | React + Vite + Tailwind. Se compila a `sitio/` | `public_html/` (el contenido de `sitio/`) |
| Puerta de la API (`api/`) | PHP 8.3/8.4: solo `index.php`, `instalar.php` y `.htaccess` | `public_html/api/` |
| Lógica de la API (`privado/`) | PHP 8 puro + PDO. Incluye `config.php` y `uploads/` | `/home/iecajetepopayan/iecajete-privado/` (**fuera** de `public_html`) |
| Base de datos (`database/`) | MariaDB 10.11 (MySQL) | cPanel → phpMyAdmin |

**Por qué una API JSON y no páginas `.php`:** el sitio ya está hecho en React. Con `fetch`, las páginas públicas, el portal y el panel comparten el mismo diseño y los mismos componentes. Convertir las páginas a `.php` obligaría a mantener dos copias del header, el footer y los estilos.

### Seguridad

- **Consultas:** todas con sentencias preparadas de PDO (`q()` en `privado/src/bd.php`).
- **Sesión:** sesión PHP con cookie `HttpOnly`, `SameSite=Strict` y `Secure` en HTTPS. Se cierra tras 2 horas sin actividad.
- **CSRF:** token en cada petición que cambia datos (cabecera `X-CSRF-Token`) y en el formulario de instalación.
- **Contraseñas:** se guardan con `password_hash`. La contraseña temporal es obligatoria de cambiar en el primer ingreso.
- **Login:** bloqueo de 15 minutos tras 5 fallos por correo o 20 por IP.
- **Permisos:** el servidor verifica el rol en **cada** acción. Que el panel oculte un botón es solo comodidad.
- **Archivos subidos:** quedan fuera de `public_html`, con nombre aleatorio, y se validan por tipo MIME real (`finfo`) y por extensión. `.htaccess` impide ejecutar o servir PHP; se entregan por la API, que revisa permisos.
- **Salida:** React escapa toda la salida; el HTML que genera PHP (`instalar.php`) usa `htmlspecialchars`.

## Qué hace el portal

| Quién | Qué puede hacer |
|---|---|
| **Admin** | Gestiona los usuarios (cuentas con contraseña temporal; las edita, desactiva y restablece). Crea los semilleros y asigna a sus docentes. Gestiona los proyectos, los PDFs y las ediciones de *Sensaciones*. Marca cualquier elemento como **destacado en inicio**, con orden y fecha de fin. Aprueba o rechaza con un comentario lo que envían los docentes (**Pendientes**). |
| **Docente** | En **Mis semilleros** propone proyectos y sube PDFs, solo en los semilleros que tiene asignados. En **Mis envíos** ve el estado de cada uno y el comentario si fue rechazado, y puede corregirlo y reenviarlo. |
| **Público** | Ve **/semilleros**, con el detalle de cada uno, sus proyectos y PDFs para ver o descargar. Lee *Sensaciones* (todas las ediciones, con visor de PDF) y los **destacados** del inicio. Solo ve lo aprobado y publicado. |

## Despliegue en cPanel (GoDaddy)

> Antes de empezar: **haz un backup completo** del WordPress actual (cPanel → Backup) y **activa el certificado SSL** (cPanel → SSL/TLS Status → AutoSSL). Sin SSL, el login no es seguro y el sitio fuerza HTTPS.

1. **PHP:** cPanel → *Select PHP Version*:
   - versión **8.3 u 8.4**;
   - extensiones activas: `pdo_mysql`, `fileinfo`, `mbstring`, `gd`;
   - en *Options*: `upload_max_filesize = 20M`, `post_max_size = 22M`, `memory_limit = 128M`.
2. **Base de datos:** cPanel → *MySQL® Databases*:
   - crea la base `iecajetepopayan_portal`;
   - crea el usuario `iecajetepopayan_portal` con una contraseña larga;
   - agrégalo a la base con **ALL PRIVILEGES**.
3. **Tablas:** cPanel → *phpMyAdmin*:
   - selecciona la base;
   - en *Importar*, carga `database/schema.sql`;
   - después importa `database/datos-iniciales.sql` (las ediciones 1 y 3 de Sensaciones).
4. **Carpeta privada:** en el *Administrador de archivos*:
   - crea `/home/iecajetepopayan/iecajete-privado/` al mismo nivel que `public_html`, **no dentro**;
   - sube ahí todo el contenido de `privado/`.
5. **`config.php`:** dentro de `iecajete-privado/`:
   - copia `config.example.php` como `config.php`;
   - edítalo con los datos de la base, `'entorno' => 'produccion'` y una `clave_instalacion` larga y aleatoria.
6. **Permisos:**
   - `config.php` → **600**;
   - carpeta `uploads/` y sus subcarpetas → **755**;
   - los demás archivos → **644**.
7. **Sitio y API:**
   - sube el contenido de `sitio/` a `public_html/` (incluye `.htaccess`);
   - sube la carpeta `api/` a `public_html/api/`;
   - retira o mueve el WordPress anterior para que no choque con el sitio nuevo.
8. **Primer administrador:**
   - abre `https://iecajete.edu.co/api/instalar.php`;
   - escribe la clave de instalación y crea la cuenta;
   - **borra `public_html/api/instalar.php`**. Además, el instalador se bloquea solo cuando ya existe un admin.
9. **Primer ingreso:** entra en `https://iecajete.edu.co/portal` y crea las cuentas de los docentes desde **Usuarios**.

**Para actualizar el sitio después:** ejecuta `npm run build` en `frontend/` y vuelve a subir el contenido de `sitio/`. Si cambió la API, sube también `privado/`, pero **nunca reemplaces `config.php` ni `uploads/`**.

## Abrir el sitio completo en este computador (lo más fácil)

1. En la carpeta `iecajete-web`, haz **doble clic en `INICIAR-SITIO.bat`**. Enciende la base de datos y el servidor, y abre **http://localhost:8000** con todo funcionando (portal, semilleros, destacados).
2. Para apagarlo: **doble clic en `DETENER-SITIO.bat`**.

Si abres `sitio\index.html` con doble clic y el servidor está encendido, la página salta sola a `http://localhost:8000`. Si está apagado, muestra las páginas públicas y un aviso para iniciar el `.bat`.

El `.bat` muestra el sitio **compilado** (`sitio/`). Si cambias el código, ejecuta `npm run build` en `frontend/` para verlo, o usa el modo de desarrollo (abajo).

## Desarrollo local (Windows)

**Requisitos:**
- Node 22 o superior;
- PHP 8.4 (`winget install PHP.PHP.NTS.8.4`, con `php.ini` y las extensiones `pdo_mysql`, `fileinfo`, `mbstring`, `gd` y `curl`);
- MariaDB 10.11 portable, descomprimida en `C:\Users\<usuario>\dev-tools\`.

```powershell
# Una sola vez: crea la base local (puerto 3307), importa el esquema y genera privado\config.php
powershell -ExecutionPolicy Bypass -File herramientas\preparar-local.ps1

# Cada vez que vayas a trabajar: base de datos + API PHP (puerto 8000) + sitio (http://localhost:5173)
powershell -ExecutionPolicy Bypass -File herramientas\iniciar-local.ps1

# Para apagar la base de datos y PHP
powershell -ExecutionPolicy Bypass -File herramientas\detener-local.ps1
```

**Primer admin en local**, si la base está vacía:
1. Abre http://localhost:5173/api/instalar.php.
2. Usa la clave que mostró `preparar-local.ps1`; también está en `privado\config.php`.

**Datos de demostración.** Llenan la base local con semilleros, proyectos, PDFs, envíos pendientes y destacados. **Vacían la base local primero:**

```powershell
php herramientas\cargar-demo.php --borrar-datos-locales
# Admin: admin@demo.local / AdminDemo2026 · Docentes: laura@demo.local / LauraDemo2026, pedro@demo.local / PedroDemo2026
# Usuario de pruebas estable (entra directo, sin cambiar la contraseña): pruebas@demo.local / Pruebas2026
```

**Pruebas automáticas de la API.** Hay 124 pruebas en 5 archivos. Corren contra la base **local** y la **vacían** al empezar:

```powershell
foreach ($f in 'a','b','c','d','e') { php "pruebas\fase-$f.php" --borrar-datos-locales }
```

Abierto con doble clic, `sitio\index.html` muestra las páginas públicas sin servidor. El portal necesita la API.

## Estructura

```
api/            puerta pública de la API (public_html/api)
privado/        lógica PHP, config.php, uploads/ (fuera de public_html)
  src/          conexión PDO, sesión, CSRF, autenticación, validación
  rutas/        un archivo por recurso de la API
database/       schema.sql (y datos iniciales)
frontend/       código del sitio (React)
  src/panel/    panel de administración y del docente
sitio/          build listo para subir (se genera con npm run build)
herramientas/   scripts de PowerShell para el entorno local
pruebas/        pruebas de punta a punta de la API
```
