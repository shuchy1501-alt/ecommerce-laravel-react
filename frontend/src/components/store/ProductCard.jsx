import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Plus } from 'lucide-react'
import RatingStars from './RatingStars'
import { useWishlist } from '@/context/WishlistContext'
import { useToast } from '@/context/ToastContext'

const BADGE_STYLES = {
  new: { label: 'NEW', className: 'bg-brand-dark text-white' },
  'best-seller': { label: 'BEST SELLER', className: 'bg-amber-500 text-white' },
  sale: { label: 'SALE', className: 'bg-brand-primary text-white' },
}

export default function ProductCard({ product, onQuickAdd }) {
  const { isWishlisted, toggle } = useWishlist()
  const toast = useToast()
  const navigate = useNavigate()
  const [imgIndex, setImgIndex] = useState(0)
  const wishlisted = isWishlisted(product.id)
  const images = product.images?.length ? product.images : ['https://placehold.co/600x800?text=No+Image']
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null

  const handleWishlist = async (e) => {
    e.preventDefault()
    try {
      const result = await toggle(product.id)
      if (result?.requiresAuth) {
        toast.info('Please login to save products to your wishlist.', {
          duration: 6000,
        })
        navigate('/login', { state: { from: { pathname: '/' } } })
        return
      }
      toast[wishlisted ? 'info' : 'success'](wishlisted ? 'Removed from wishlist.' : 'Added to wishlist.')
    } catch {
      toast.error('Could not update your wishlist. Please try again.')
    }
  }

  return (
    <div
      className="group relative flex flex-col"
      onMouseEnter={() => images[1] && setImgIndex(1)}
      onMouseLeave={() => setImgIndex(0)}
    >
      <Link to={`/product/${product.slug}`} className="relative block overflow-hidden rounded-lg bg-brand-light aspect-[3/4]">
        <img
          src={images[imgIndex]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.badges?.map((b) =>
            BADGE_STYLES[b] ? (
              <span key={b} className={`rounded px-2 py-1 text-[10px] font-bold tracking-wide ${BADGE_STYLES[b].className}`}>
                {BADGE_STYLES[b].label}
              </span>
            ) : null
          )}
          {discount && (
            <span className="rounded bg-brand-danger px-2 py-1 text-[10px] font-bold tracking-wide text-white">
              {discount}% OFF
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlisted}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors hover:bg-white"
        >
          <Heart size={16} className={wishlisted ? 'fill-brand-primary text-brand-primary' : 'text-brand-dark'} />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            onQuickAdd?.(product)
          }}
          className="absolute inset-x-2 bottom-2 flex translate-y-10 items-center justify-center gap-1.5 rounded-md bg-brand-dark py-2 text-xs font-semibold text-white opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
        >
          <Plus size={14} /> Quick Add
        </button>
      </Link>

      <div className="mt-3 flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wide text-gray-500">{product.brand}</span>
        <Link to={`/product/${product.slug}`} className="line-clamp-2 text-sm font-medium text-brand-dark hover:text-brand-primary">
          {product.name}
        </Link>
        <RatingStars rating={product.rating} reviewCount={product.reviewCount} />
        <div className="flex items-center gap-2">
          <span className="font-brand-display text-lg font-semibold text-brand-dark">৳{product.price.toLocaleString()}</span>
          {product.oldPrice && <span className="text-sm text-gray-400 line-through">৳{product.oldPrice.toLocaleString()}</span>}
        </div>
      </div>
    </div>
  )
}
