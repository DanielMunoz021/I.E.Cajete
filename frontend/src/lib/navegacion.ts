// Saltos dentro de la página. No se usan enlaces "#id" porque, abierto con doble clic,
// el sitio navega con #/ruta y un "#contacto" se tomaría como una ruta.

export function irAContacto() {
  document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })
}

export function irAlContenido() {
  const main = document.getElementById('contenido')
  main?.focus()
  main?.scrollIntoView()
}
