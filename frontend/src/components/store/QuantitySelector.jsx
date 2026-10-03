import { Minus, Plus } from 'lucide-react'

export default function QuantitySelector({ value, onChange, max = 99, min = 1, size = 'md', disabled = false }) {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))
  const h = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'

  return (
    <div className={`inline-flex items-center rounded-md border border-brand-border ${disabled ? 'opacity-50' : ''}`}>
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className={`${h} flex items-center justify-center text-brand-dark disabled:opacity-30`}
      >
        <Minus size={14} />
      </button>
      <span className="w-8 text-center text-sm font-medium" aria-live="polite">{value}</span>
      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        className={`${h} flex items-center justify-center text-brand-dark disabled:opacity-30`}
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
