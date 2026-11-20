import type { Estado } from '../lib/demo'

const ESTILOS: Record<Estado, string> = {
  pendiente: 'bg-accent-yellow text-foreground',
  aprobada: 'bg-primary-soft text-primary-darker',
  rechazada: 'bg-danger-soft text-danger',
}

const TEXTO: Record<Estado, string> = { pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada' }

export default function EstadoChip({ estado }: { estado: Estado }) {
  return <span className={`rounded-full px-3 py-1 text-[13px] font-bold ${ESTILOS[estado]}`}>{TEXTO[estado]}</span>
}
