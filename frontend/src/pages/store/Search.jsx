import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Breadcrumb from '@/components/store/Breadcrumb'
import ProductGrid, { ProductGridSkeleton } from '@/components/store/ProductGrid'
import EmptyState from '@/components/feedback/EmptyState'
import { getProducts } from '@/api/productService'
import { useToast } from '@/context/ToastContext'

export default function Search() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const toast = useToast()

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    getProducts({ search: q, per_page: 24 })
      .then((res) => active && setResult(res))
      .catch(() => {
        if (active) {
          setError(true)
          toast.error('Unable to load search results. Please try again.')
        }
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const products = result?.data ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: 'Search' }]} />
      <h1 className="mt-4 font-brand-display text-2xl font-semibold text-brand-dark">
        Search results for &ldquo;{q}&rdquo;
      </h1>
      {result && <p className="mt-1 text-sm text-gray-500">{result.meta.total} results found</p>}

      <div className="mt-6">
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : error ? (
          <EmptyState title="Something went wrong" description="Unable to load search results. Please try again." />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description={`We couldn't find anything matching "${q}".`}
            action={
              <div className="flex justify-center gap-3">
                <Link to="/shop" className="rounded-md border border-brand-dark px-4 py-2 text-sm font-medium text-brand-dark">Clear Filters</Link>
                <Link to="/" className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white">Continue Shopping</Link>
              </div>
            }
          />
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </div>
  )
}
