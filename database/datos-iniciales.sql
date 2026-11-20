-- =====================================================================
-- Datos iniciales — importar DESPUÉS de schema.sql.
-- Las dos ediciones de Sensaciones que ya están publicadas en el sitio.
-- Sus archivos están en el build (docs/ e img/), no en uploads/.
-- =====================================================================
SET NAMES utf8mb4;

INSERT INTO ediciones_sensaciones (numero, titulo, fecha, descripcion, pdf_ruta_publica, portada_ruta_publica, publicada) VALUES
(3, 'Tercera edición', '2025-11-01',
 'Donde las palabras inspiran, unen y transforman.\nEn esta edición: Inteligencia artificial (pág. 5, Juan Carlos Diago U.) · Función de las matemáticas (pág. 8, Mati López) · Ciencia, arte, deporte y familia (pág. 14) · Class 2025: un nuevo capítulo (pág. 16).',
 'docs/sensaciones-3-2025.pdf', 'img/sensaciones-3-2025.jpg', 1),
(1, 'Primera edición', '2022-05-01',
 'Los invitamos a leer, a sentir y a pensar Sensaciones, que hemos realizado con dedicación, responsabilidad y afecto por todos los integrantes de esta hermosa Institución Educativa Cajete.',
 'docs/sensaciones-1-2022.pdf', NULL, 1);
