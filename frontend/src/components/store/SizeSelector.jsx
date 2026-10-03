export default function SizeSelector({ sizes, selected, onSelect, isAvailable }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select size">
      {sizes.map((size) => {
        const available = isAvailable ? isAvailable(size) : true
        const active = selected === size
        return (
          <button
            key={size}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={!available}
            onClick={() => onSelect(size)}
            className={`min-w-[44px] rounded-md border px-3 py-2 text-sm font-medium transition-colors
              ${active ? 'border-brand-dark bg-brand-dark text-white' : 'border-brand-border text-brand-dark hover:border-brand-dark'}
              ${!available ? 'cursor-not-allowed border-brand-border text-gray-300 line-through hover:border-brand-border' : ''}`}
          >
            {size}
          </button>
        )
      })}
    </div>
  )
}
