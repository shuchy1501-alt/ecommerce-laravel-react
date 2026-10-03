import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import Breadcrumb from '@/components/store/Breadcrumb'
import ShopFilters from '@/components/store/ShopFilters'
import ProductGrid, { ProductGridSkeleton } from '@/components/store/ProductGrid'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/feedback/EmptyState'
import { getProducts } from '@/api/productService'
import { useToast } from '@/context/ToastContext'

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'best_selling', label: 'Best Selling' },
  { value: 'top_rated', label: 'Top Rated' },
]

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const toast = useToast()

  const filters = useMemo(() => {
    const f = {}
    for (const [key, value] of searchParams.entries()) {
      if (key === 'brand' || key === 'size' || key === 'color') {
        f[key] = f[key] ? [...f[key], value] : [value]
      } else if (key === 'page') {
        f.page = Number(value)
      } else if (key === 'max_price' || key === 'min_rating') {
        f[key] = Number(value)
      } else if (key === 'in_stock') {
        f[key] = value === '1'
      } else {
        f[key] = value
      }
    }
    return f
  }, [searchParams])

  const setFilters = (next) => {
    const params = new URLSearchParams()
    Object.entries(next).forEach(([key, value]) => {
      if (value == null || value === '' || value === false) return
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v))
      } else {
        params.set(key, String(value === true ? 1 : value))
      }
    })
    params.delete('page')
    setSearchParams(params)
  }

  const setPage = (page) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page)
    setSearchParams(params)
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    getProducts({ ...filters, per_page: 12, page: filters.page || 1 })
      .then((res) => active && setResult(res))
      .catch(() => {
        if (active) {
          setError(true)
          toast.error('Unable to load products. Please try again.')
        }
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const products = result?.data ?? []
  const meta = result?.meta

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: 'Shop' }]} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-brand-display text-3xl font-semibold text-brand-dark">Shop All</h1>
          {meta && <p className="mt-1 text-sm text-gray-500">{meta.total} products</p>}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 rounded-md border border-brand-border px-3 py-2 text-sm font-medium text-brand-dark lg:hidden"
          >
            <SlidersHorizontal size={15} /> Filters
          </button>
          <select
            value={filters.sort || 'featured'}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            className="rounded-md border border-brand-border px-3 py-2 text-sm text-brand-dark focus:border-brand-primary focus:outline-none"
            aria-label="Sort products"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <ShopFilters filters={filters} onChange={setFilters} onClear={() => setSearchParams({})} />
        </aside>

        <div>
          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : error ? (
            <EmptyState title="Unable to load products" description="Please try again." />
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters or search terms."
              action={
                <div className="flex justify-center gap-3">
                  <button onClick={() => setSearchParams({})} className="rounded-md border border-brand-dark px-4 py-2 text-sm font-medium text-brand-dark">Clear Filters</button>
                  <a href="/shop" className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white">Continue Shopping</a>
                </div>
              }
            />
          ) : (
            <>
              <ProductGrid products={products} />
              {meta && (
                <div className="mt-4">
                  <Pagination
                    currentPage={meta.current_page}
                    lastPage={meta.last_page}
                    total={meta.total}
                    perPage={meta.per_page}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-brand-dark/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-brand-dark">Filters</h2>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close filters"><X size={20} /></button>
            </div>
            <ShopFilters filters={filters} onChange={setFilters} onClear={() => setSearchParams({})} />
            <button
              onClick={() => setDrawerOpen(false)}
              className="mt-6 w-full rounded-md bg-brand-primary py-3 text-sm font-semibold text-white"
            >
              Show Results
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
