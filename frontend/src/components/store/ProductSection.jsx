import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from './ProductCard'
import QuickAddModal from './QuickAddModal'

export default function ProductSection({ title, subtitle, products, viewAllHref }) {
  const [quickAddProduct, setQuickAddProduct] = useState(null)

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-brand-display text-3xl font-semibold text-brand-dark sm:text-4xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link to={viewAllHref} className="hidden text-sm font-medium text-brand-primary hover:underline sm:block">
            View All
          </Link>
        )}
      </div>

      <div className="mt-8 -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4 lg:gap-6">
        {products.map((product) => (
          <div key={product.id} className="w-40 flex-shrink-0 snap-start sm:w-auto">
            <ProductCard product={product} onQuickAdd={setQuickAddProduct} />
          </div>
        ))}
      </div>

      {viewAllHref && (
        <Link to={viewAllHref} className="mt-6 block text-center text-sm font-medium text-brand-primary hover:underline sm:hidden">
          View All
        </Link>
      )}

      <QuickAddModal product={quickAddProduct} open={!!quickAddProduct} onClose={() => setQuickAddProduct(null)} />
    </section>
  )
}
