import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `npm run build` deja el sitio listo en iecajete-web/sitio/:
// - se abre con doble clic en sitio/index.html (sin servidor), y
// - su contenido se sube tal cual a public_html/ en el hosting.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // En desarrollo, /api lo atiende PHP (php -S 127.0.0.1:8000 api/index.php, desde la raíz del proyecto).
  server: {
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
  build: {
    outDir: '../sitio',
    emptyOutDir: true,
  },
})
