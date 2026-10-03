import { useTaxonomy } from '@/hooks/useTaxonomy'

const COLOR_SWATCHES = [
  { name: 'Black', hex: '#111827' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Red', hex: '#DC2626' },
  { name: 'Blue', hex: '#3B5B92' }, { name: 'Green', hex: '#1E5C4A' }, { name: 'Brown', hex: '#6B4226' },
  { name: 'Beige', hex: '#D8CCB4' }, { name: 'Pink', hex: '#E91E63' },
]
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42', '43', '44']
const PRICE_STEPS = [500, 1000, 2000, 3000, 5000, 10000]

export default function ShopFilters({ filters, onChange, onClear }) {
  const { categories, brands } = useTaxonomy()

  const toggleArrayValue = (key, value) => {
    const current = filters[key] || []
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    onChange({ ...filters, [key]: next })
  }

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-dark">Filters</h3>
        <button onClick={onClear} className="text-xs font-medium text-brand-primary hover:underline">Clear All</button>
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-brand-dark">Categories</legend>
        <div className="space-y-2">
          {categories.map((c) => (
            <label key={c.slug} className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
              <input
                type="radio"
                name="category"
                checked={filters.category === c.slug}
                onChange={() => onChange({ ...filters, category: c.slug })}
                className="h-4 w-4 accent-[#E91E63]"
              />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-brand-dark">Brands</legend>
        <div className="space-y-2">
          {brands.map((b) => (
            <label key={b.slug} className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={(filters.brand || []).includes(b.slug)}
                onChange={() => toggleArrayValue('brand', b.slug)}
                className="h-4 w-4 accent-[#E91E63]"
              />
              {b.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-brand-dark">Price Range</legend>
        <input
          type="range"
          min={0}
          max={PRICE_STEPS.length - 1}
          step={1}
          value={PRICE_STEPS.indexOf(filters.max_price || 10000)}
          onChange={(e) => onChange({ ...filters, max_price: PRICE_STEPS[Number(e.target.value)] })}
          className="w-full accent-[#E91E63]"
        />
        <p className="mt-1 text-xs text-gray-500">
          ৳0 to ৳{(filters.max_price || 10000).toLocaleString()}{filters.max_price === 10000 ? '+' : ''}
        </p>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-brand-dark">Size</legend>
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleArrayValue('size', s)}
              className={`rounded border px-2.5 py-1 text-xs font-medium ${
                (filters.size || []).includes(s) ? 'border-brand-dark bg-brand-dark text-white' : 'border-brand-border text-gray-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-brand-dark">Color</legend>
        <div className="flex flex-wrap gap-2">
          {COLOR_SWATCHES.map((c) => (
            <button
              key={c.name}
              type="button"
              title={c.name}
              onClick={() => toggleArrayValue('color', c.name)}
              className={`h-7 w-7 rounded-full ${
                (filters.color || []).includes(c.name) ? 'ring-2 ring-brand-dark ring-offset-2' : 'ring-1 ring-brand-border'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-brand-dark">Rating</legend>
        <div className="space-y-2">
          {[4, 3, 2].map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
              <input
                type="radio"
                name="rating"
                checked={filters.min_rating === r}
                onChange={() => onChange({ ...filters, min_rating: r })}
                className="h-4 w-4 accent-[#E91E63]"
              />
              {r}★ &amp; up
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-brand-dark">Availability</legend>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={!!filters.in_stock}
            onChange={() => onChange({ ...filters, in_stock: !filters.in_stock })}
            className="h-4 w-4 accent-[#E91E63]"
          />
          In Stock Only
        </label>
      </fieldset>
    </div>
  )
}
