import { useEffect, useRef, useState } from 'react'
import { adminGetProducts } from '@/api/productService'

/**
 * Async product -> variant picker (spec section 68: "Do not load thousands
 * of products into one dropdown"). Types a product name, picks a product
 * from the results, then picks one of its variants.
 */
export default function ProductVariantSearch({ onSelect, placeholder = 'Search product by name or SKU...' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeProduct, setActiveProduct] = useState(null)
  const boxRef = useRef(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const timer = setTimeout(() => {
      adminGetProducts({ search: query, per_page: 8 })
        .then((res) => setResults(res.data || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false)
        setActiveProduct(null)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const pickVariant = (product, variant) => {
    onSelect(product, variant)
    setQuery('')
    setResults([])
    setOpen(false)
    setActiveProduct(null)
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setActiveProduct(null)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
      />

      {open && query.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-sm border border-stone-light bg-white shadow-lg">
          {loading && <p className="px-3 py-2 text-xs text-stone">Searching...</p>}

          {!loading && !activeProduct && results.length === 0 && (
            <p className="px-3 py-2 text-xs text-stone">No products found.</p>
          )}

          {!loading &&
            !activeProduct &&
            results.map((product) => (
              <button
                type="button"
                key={product.id}
                onClick={() => setActiveProduct(product)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-bone-dim"
              >
                <span className="text-ink">{product.name}</span>
                <span className="text-xs text-stone">{product.variants?.length || 0} variant(s)</span>
              </button>
            ))}

          {activeProduct && (
            <div>
              <button
                type="button"
                onClick={() => setActiveProduct(null)}
                className="w-full border-b border-stone-light px-3 py-2 text-left text-xs text-oxblood hover:underline"
              >
                ← Back to results
              </button>
              {(activeProduct.variants || []).length === 0 && (
                <p className="px-3 py-3 text-xs text-stone">This product has no variants.</p>
              )}
              {(activeProduct.variants || []).map((variant) => (
                <button
                  type="button"
                  key={variant.id}
                  onClick={() => pickVariant(activeProduct, variant)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-bone-dim"
                >
                  <span className="text-ink">
                    {variant.sku} {[variant.size, variant.color].filter(Boolean).length ? `(${[variant.size, variant.color].filter(Boolean).join(' / ')})` : ''}
                  </span>
                  <span className="text-xs text-stone">Stock: {variant.stock}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
