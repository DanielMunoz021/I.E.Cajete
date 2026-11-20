// Después de `vite build`: mete el JS y el CSS dentro de sitio/index.html.
// Así la página se abre con doble clic: los navegadores bloquean los <script type="module" src>
// externos cuando la página viene de file://, pero no los scripts escritos dentro del HTML.
import { readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const sitio = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'sitio')
const indexPath = join(sitio, 'index.html')
let html = readFileSync(indexPath, 'utf8')
const usados = []

html = html.replace(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/g, (_, f) => {
  usados.push(f)
  const js = readFileSync(join(sitio, f), 'utf8').replace(/<\/script/gi, '<\\/script')
  return `<script type="module">${js}</script>`
})
html = html.replace(/<link rel="stylesheet" crossorigin href="\.\/(assets\/[^"]+\.css)">/g, (_, f) => {
  usados.push(f)
  return `<style>${readFileSync(join(sitio, f), 'utf8')}</style>`
})

if (usados.length === 0) throw new Error('No se encontró el JS/CSS del build para incrustar: revisa el formato de sitio/index.html')

writeFileSync(indexPath, html)
for (const f of usados) rmSync(join(sitio, f))
if (readdirSync(join(sitio, 'assets')).length === 0) rmSync(join(sitio, 'assets'), { recursive: true })
console.log(`Incrustados en sitio/index.html: ${usados.join(', ')}`)
