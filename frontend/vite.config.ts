import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `npm run build` deja el sitio listo en iecajete-web/sitio/:
// - se abre con doble clic en sitio/index.html (sin servidor), y
// - su contenido se sube tal cual a public_html/ en el hosting.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../sitio',
    emptyOutDir: true,
  },
})
