import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import WishlistProductCard from '@/components/store/WishlistProductCard'
import QuickAddModal from '@/components/store/QuickAddModal'
import { useWishlist } from '@/context/WishlistContext'
import { useToast } from '@/context/ToastContext'
import { getProductBySlugApi } from '@/api/productService'
import { WishlistSkeleton } from '@/components/ui/Skeleton'

export default function AccountWishlist() {
  const { items, loading, remove, refresh } = useWishlist()
  const toast = useToast()
  const [modalProduct, setModalProduct] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loadingProductSlug, setLoadingProductSlug] = useState(null)

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRemove = async (productId) => {
    try {
      await remove(productId)
      toast.info('Removed from wishlist.')
    } catch {
      toast.error('Could not remove this item. Please try again.')
    }
  }

  // Spec section 22: variants require a selection modal, never auto-add.
  const handleAddToCart = async (product) => {
    setLoadingProductSlug(product.slug)
    try {
      const full = await getProductBySlugApi(product.slug)
      setModalProduct(full)
      setModalOpen(true)
    } catch {
      toast.error('Could not load this product right now.')
    } finally {
      setLoadingProductSlug(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="font-brand-display text-2xl font-semibold text-brand-dark">My Wishlist</h1>
        <WishlistSkeleton />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <Heart size={48} className="mx-auto text-brand-border" />
        <h1 className="mt-5 font-brand-display text-2xl font-semibold text-brand-dark">Your wishlist is empty.</h1>
        <p className="mt-2 text-sm text-gray-500">Save your favorite styles and find them here later.</p>
        <Link to="/shop" className="mt-6 inline-block rounded-md bg-brand-primary px-6 py-3 text-sm font-semibold text-white hover:bg-brand-primary-dark">
          EXPLORE PRODUCTS
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="font-brand-display text-2xl font-semibold text-brand-dark">My Wishlist</h1>
      <div className="divide-y divide-brand-border border-y border-brand-border">
        {items.map((item) => (
          <WishlistProductCard
            key={item.id}
            item={item}
            onRemove={handleRemove}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>

      <QuickAddModal product={modalProduct} open={modalOpen} onClose={() => setModalOpen(false)} />

      {loadingProductSlug && (
        <p className="text-xs text-gray-400">Loading product options…</p>
      )}
    </div>
  )
}
