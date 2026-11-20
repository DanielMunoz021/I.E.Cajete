import { useState } from 'react'
import { Star } from 'lucide-react'
import { api, mensajeDeError } from '../lib/api'

export type TipoDestacado = 'semillero' | 'proyecto' | 'documento' | 'edicion'

// Interruptor "Destacado en inicio" para cualquier elemento del panel.
export default function InterruptorDestacado({ tipo, id, activo, onCambio }: { tipo: TipoDestacado; id: number; activo: boolean; onCambio?: () => void }) {
  const [valor, setValor] = useState(activo)
  const [ocupado, setOcupado] = useState(false)

  const cambiar = async () => {
    setOcupado(true)
    try {
      await api.post('/destacados', { tipo, elemento_id: id, activo: !valor })
      setValor(!valor)
      onCambio?.()
    } catch (e) {
      window.alert(mensajeDeError(e))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={valor}
      disabled={ocupado}
      onClick={() => void cambiar()}
      title={valor ? 'Quitar de los destacados del inicio' : 'Mostrar en los destacados del inicio'}
      className={`inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors disabled:opacity-60 ${
        valor ? 'border-accent-yellow bg-accent-yellow text-foreground' : 'border-line bg-white text-muted-text hover:border-foreground'
      }`}
    >
      <Star size={14} fill={valor ? 'currentColor' : 'none'} aria-hidden="true" />
      {valor ? 'Destacado en inicio' : 'Destacar en inicio'}
    </button>
  )
}
