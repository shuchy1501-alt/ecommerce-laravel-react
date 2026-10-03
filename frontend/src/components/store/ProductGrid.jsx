import { useState } from 'react'
import ProductCard from './ProductCard'
import QuickAddModal from './QuickAddModal'

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] rounded-lg bg-brand-border/60" />
          <div className="mt-3 h-3 w-1/3 rounded bg-brand-border/60" />
          <div className="mt-2 h-4 w-4/5 rounded bg-brand-border/60" />
          <div className="mt-2 h-4 w-1/2 rounded bg-brand-border/60" />
        </div>
      ))}
    </div>
  )
}

export default function ProductGrid({ products }) {
  const [quickAddProduct, setQuickAddProduct] = useState(null)

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onQuickAdd={setQuickAddProduct} />
        ))}
      </div>
      <QuickAddModal product={quickAddProduct} open={!!quickAddProduct} onClose={() => setQuickAddProduct(null)} />
    </>
  )
}
