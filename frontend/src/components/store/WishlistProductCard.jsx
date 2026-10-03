import { Link } from 'react-router-dom'
import { Heart, X } from 'lucide-react'
import RatingStars from './RatingStars'

const STOCK_LABEL = {
  in_stock: { label: 'In Stock', className: 'text-brand-success bg-green-50' },
  low_stock: { label: 'Low Stock', className: 'text-brand-warning bg-amber-50' },
  out_of_stock: { label: 'Out of Stock', className: 'text-brand-danger bg-red-50' },
}

export default function WishlistProductCard({ item, onRemove, onAddToCart }) {
  const product = item.product

  // Spec section 26: deleted/inactive products must not break the page.
  if (!product || product.deleted) {
    return (
      <div className="flex items-center justify-between gap-4 py-5 sm:px-4">
        <p className="text-sm text-gray-400">This product is no longer available.</p>
        <button onClick={() => onRemove(item.product_id)} aria-label="Remove from wishlist" className="text-gray-400 hover:text-brand-danger">
          <X size={16} />
        </button>
      </div>
    )
  }

  const inactive = product.status === false
  const stock = STOCK_LABEL[product.stock_status] || STOCK_LABEL.out_of_stock
  const canAddToCart = !inactive && product.stock_status !== 'out_of_stock'

  return (
    <div className="flex gap-4 py-5 sm:px-4">
      <Link
        to={inactive ? '#' : `/product/${product.slug}`}
        onClick={(e) => inactive && e.preventDefault()}
        className="h-28 w-24 flex-shrink-0 overflow-hidden rounded-md bg-brand-light"
      >
        <img
          src={product.image || 'https://placehold.co/300x400?text=No+Image'}
          alt={product.name}
          className={`h-full w-full object-cover ${inactive ? 'grayscale opacity-60' : ''}`}
        />
      </Link>
      <div className="flex flex-1 flex-col justify-between">
        <div>
          {product.brand?.name && (
            <span className="text-[11px] uppercase tracking-wide text-gray-500">{product.brand.name}</span>
          )}
          <Link
            to={inactive ? '#' : `/product/${product.slug}`}
            onClick={(e) => inactive && e.preventDefault()}
            className="block text-sm font-medium text-brand-dark hover:text-brand-primary"
          >
            {product.name}
          </Link>
          <p className="mt-1 font-brand-display text-base font-semibold text-brand-dark">
            ৳{Number(product.final_price ?? product.selling_price ?? 0).toLocaleString()}
          </p>
          {product.rating != null && <RatingStars rating={product.rating} reviewCount={product.review_count} />}
          <div className="mt-1">
            {inactive ? (
              <span className="inline-flex w-fit items-center rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
                Currently Unavailable
              </span>
            ) : (
              <span className={`inline-flex w-fit items-center rounded px-2 py-1 text-xs font-medium ${stock.className}`}>
                {stock.label}
              </span>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={() => onAddToCart(product)}
            disabled={!canAddToCart}
            className="rounded-md bg-brand-primary px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add to Cart
          </button>
          <button
            onClick={() => onRemove(item.product_id)}
            aria-label="Remove from wishlist"
            className="flex items-center gap-1 text-gray-400 hover:text-brand-danger"
          >
            <Heart size={16} className="fill-current" />
          </button>
        </div>
      </div>
    </div>
  )
}
