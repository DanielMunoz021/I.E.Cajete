-- =====================================================================
-- Esquema de la base de datos — Portal Docente IE Cajete
-- MariaDB 10.11 (hosting cPanel) · utf8mb4
-- Importar en phpMyAdmin sobre una base de datos VACÍA.
-- =====================================================================

SET NAMES utf8mb4;
SET time_zone = '-05:00';

-- ---------------------------------------------------------------------
-- Usuarios y acceso
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre              VARCHAR(120) NOT NULL,
  correo              VARCHAR(190) NOT NULL,
  rol                 ENUM('admin','docente') NOT NULL DEFAULT 'docente',
  clave_hash          VARCHAR(255) NOT NULL,
  debe_cambiar_clave  TINYINT(1) NOT NULL DEFAULT 1,
  activo              TINYINT(1) NOT NULL DEFAULT 1,
  ultimo_ingreso      DATETIME NULL,
  creado_en           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_correo (correo),
  KEY idx_usuarios_rol_activo (rol, activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Registro de intentos de inicio de sesión (para limitar fuerza bruta)
CREATE TABLE intentos_login (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  correo     VARCHAR(190) NOT NULL,
  ip         VARCHAR(45) NOT NULL,
  exitoso    TINYINT(1) NOT NULL DEFAULT 0,
  creado_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_intentos_ip_fecha (ip, creado_en),
  KEY idx_intentos_correo_fecha (correo, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Archivos físicos (PDF e imágenes). Se guardan FUERA de public_html
-- con nombre aleatorio y se sirven por la API.
-- ---------------------------------------------------------------------
CREATE TABLE archivos (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo             ENUM('pdf','imagen') NOT NULL,
  ruta_interna     VARCHAR(255) NOT NULL,          -- ej.: pdf/2026/11/3f9a…c2.pdf
  nombre_original  VARCHAR(255) NOT NULL,
  mime             VARCHAR(100) NOT NULL,
  tamano           INT UNSIGNED NOT NULL,          -- bytes
  subido_por       INT UNSIGNED NULL,
  creado_en        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_archivos_ruta (ruta_interna),
  KEY idx_archivos_subido_por (subido_por),
  CONSTRAINT fk_archivos_usuario FOREIGN KEY (subido_por) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Semilleros y proyectos
-- ---------------------------------------------------------------------
CREATE TABLE semilleros (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(150) NOT NULL,
  slug         VARCHAR(160) NOT NULL,
  descripcion  TEXT NULL,
  lider_id     INT UNSIGNED NULL,
  imagen_id    INT UNSIGNED NULL,
  activo       TINYINT(1) NOT NULL DEFAULT 1,
  creado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_semilleros_slug (slug),
  KEY idx_semilleros_activo (activo),
  CONSTRAINT fk_semilleros_lider  FOREIGN KEY (lider_id)  REFERENCES usuarios (id) ON DELETE SET NULL,
  CONSTRAINT fk_semilleros_imagen FOREIGN KEY (imagen_id) REFERENCES archivos (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Docentes asignados a cada semillero (pueden proponer proyectos y subir PDFs en él)
CREATE TABLE semillero_docentes (
  semillero_id  INT UNSIGNED NOT NULL,
  usuario_id    INT UNSIGNED NOT NULL,
  PRIMARY KEY (semillero_id, usuario_id),
  KEY idx_semillero_docentes_usuario (usuario_id),
  CONSTRAINT fk_sd_semillero FOREIGN KEY (semillero_id) REFERENCES semilleros (id) ON DELETE CASCADE,
  CONSTRAINT fk_sd_usuario   FOREIGN KEY (usuario_id)   REFERENCES usuarios (id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE proyectos (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  semillero_id         INT UNSIGNED NOT NULL,
  titulo               VARCHAR(200) NOT NULL,
  slug                 VARCHAR(210) NOT NULL,
  resumen              TEXT NULL,
  integrantes          TEXT NULL,                  -- un integrante por línea
  anio                 SMALLINT UNSIGNED NULL,
  imagen_id            INT UNSIGNED NULL,
  estado               ENUM('en_curso','finalizado') NOT NULL DEFAULT 'en_curso',
  -- Revisión (lo que crea el admin entra aprobado; lo que envía un docente, pendiente)
  revision             ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  comentario_revision  TEXT NULL,
  enviado_por          INT UNSIGNED NULL,
  revisado_por         INT UNSIGNED NULL,
  revisado_en          DATETIME NULL,
  creado_en            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_proyectos_slug (slug),
  KEY idx_proyectos_semillero_revision (semillero_id, revision),
  KEY idx_proyectos_revision (revision),
  KEY idx_proyectos_enviado_por (enviado_por),
  CONSTRAINT fk_proyectos_semillero FOREIGN KEY (semillero_id) REFERENCES semilleros (id) ON DELETE CASCADE,
  CONSTRAINT fk_proyectos_imagen    FOREIGN KEY (imagen_id)    REFERENCES archivos (id)   ON DELETE SET NULL,
  CONSTRAINT fk_proyectos_enviado   FOREIGN KEY (enviado_por)  REFERENCES usuarios (id)   ON DELETE SET NULL,
  CONSTRAINT fk_proyectos_revisado  FOREIGN KEY (revisado_por) REFERENCES usuarios (id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PDFs producidos (informes, artículos, pósters). Pertenecen a un semillero O a un proyecto.
CREATE TABLE documentos (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  archivo_id           INT UNSIGNED NOT NULL,
  titulo               VARCHAR(200) NOT NULL,
  descripcion          TEXT NULL,
  fecha                DATE NULL,
  semillero_id         INT UNSIGNED NULL,
  proyecto_id          INT UNSIGNED NULL,
  revision             ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  comentario_revision  TEXT NULL,
  enviado_por          INT UNSIGNED NULL,
  revisado_por         INT UNSIGNED NULL,
  revisado_en          DATETIME NULL,
  creado_en            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_documentos_semillero (semillero_id, revision),
  KEY idx_documentos_proyecto (proyecto_id, revision),
  KEY idx_documentos_revision (revision),
  KEY idx_documentos_enviado_por (enviado_por),
  CONSTRAINT fk_documentos_archivo   FOREIGN KEY (archivo_id)   REFERENCES archivos (id)   ON DELETE RESTRICT,
  CONSTRAINT fk_documentos_semillero FOREIGN KEY (semillero_id) REFERENCES semilleros (id) ON DELETE CASCADE,
  CONSTRAINT fk_documentos_proyecto  FOREIGN KEY (proyecto_id)  REFERENCES proyectos (id)  ON DELETE CASCADE,
  CONSTRAINT fk_documentos_enviado   FOREIGN KEY (enviado_por)  REFERENCES usuarios (id)   ON DELETE SET NULL,
  CONSTRAINT fk_documentos_revisado  FOREIGN KEY (revisado_por) REFERENCES usuarios (id)   ON DELETE SET NULL,
  CONSTRAINT ck_documentos_padre CHECK ((semillero_id IS NULL) <> (proyecto_id IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Magazine escolar Sensaciones
-- ---------------------------------------------------------------------
CREATE TABLE ediciones_sensaciones (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  numero       SMALLINT UNSIGNED NOT NULL,
  titulo       VARCHAR(150) NOT NULL,              -- ej.: "Tercera edición"
  fecha        DATE NOT NULL,
  descripcion  TEXT NULL,
  portada_id   INT UNSIGNED NULL,
  pdf_id       INT UNSIGNED NULL,
  pdf_ruta_publica VARCHAR(255) NULL,              -- ediciones históricas que ya están en el sitio (docs/…)
  portada_ruta_publica VARCHAR(255) NULL,
  publicada    TINYINT(1) NOT NULL DEFAULT 1,
  creado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ediciones_numero (numero),
  KEY idx_ediciones_fecha (publicada, fecha),
  CONSTRAINT fk_ediciones_portada FOREIGN KEY (portada_id) REFERENCES archivos (id) ON DELETE SET NULL,
  CONSTRAINT fk_ediciones_pdf     FOREIGN KEY (pdf_id)     REFERENCES archivos (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Destacados en la página de inicio
-- elemento_id apunta a la tabla que indica `tipo` (no puede tener FK a 4 tablas):
-- al borrar un elemento, la API borra su destacado en la misma transacción.
-- ---------------------------------------------------------------------
CREATE TABLE destacados (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo         ENUM('semillero','proyecto','documento','edicion') NOT NULL,
  elemento_id  INT UNSIGNED NOT NULL,
  orden        INT NOT NULL DEFAULT 0,
  fin          DATE NULL,                          -- último día en que se muestra (NULL = sin fin)
  activo       TINYINT(1) NOT NULL DEFAULT 1,
  creado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_destacados_elemento (tipo, elemento_id),
  KEY idx_destacados_activo_orden (activo, orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
