import { Check } from 'lucide-react'

export default function ColorSelector({ colors, selected, onSelect, isAvailable }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select color">
      {colors.map((color) => {
        const available = isAvailable ? isAvailable(color.name) : true
        const active = selected === color.name
        const isLight = ['#FFFFFF', '#F9FAFB'].includes(color.hex?.toUpperCase())
        return (
          <button
            key={color.name}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={color.name}
            disabled={!available}
            onClick={() => onSelect(color.name)}
            title={color.name}
            className={`relative h-9 w-9 rounded-full transition-all ${!available ? 'cursor-not-allowed opacity-30' : ''}
              ${active ? 'ring-2 ring-brand-dark ring-offset-2' : 'ring-1 ring-brand-border ring-offset-1'}`}
            style={{ backgroundColor: color.hex }}
          >
            {active && <Check size={14} className={`absolute inset-0 m-auto ${isLight ? 'text-brand-dark' : 'text-white'}`} />}
          </button>
        )
      })}
    </div>
  )
}
