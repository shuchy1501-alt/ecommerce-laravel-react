import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import Breadcrumb from '@/components/store/Breadcrumb'
import WishlistProductCard from '@/components/store/WishlistProductCard'
import QuickAddModal from '@/components/store/QuickAddModal'
import { useWishlist } from '@/context/WishlistContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { getProductBySlugApi } from '@/api/productService'
import { WishlistSkeleton } from '@/components/ui/Skeleton'

export default function Wishlist() {
  const { isAuthenticated } = useAuth()
  const { items, loading, remove, refresh } = useWishlist()
  const toast = useToast()
  const [modalProduct, setModalProduct] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

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

  const handleAddToCart = async (product) => {
    try {
      const full = await getProductBySlugApi(product.slug)
      setModalProduct(full)
      setModalOpen(true)
    } catch {
      toast.error('Could not load this product right now.')
    }
  }

  // Spec section 51: guests never get a server-side wishlist here.
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <Heart size={48} className="mx-auto text-brand-border" />
        <h1 className="mt-5 font-brand-display text-2xl font-semibold text-brand-dark">Sign in to see your wishlist</h1>
        <p className="mt-2 text-sm text-gray-500">Please login to save products to your wishlist.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/login" className="rounded-md bg-brand-primary px-6 py-3 text-sm font-semibold text-white hover:bg-brand-primary-dark">
            LOGIN
          </Link>
          <Link to="/register" className="rounded-md border border-brand-dark px-6 py-3 text-sm font-semibold text-brand-dark hover:bg-brand-light">
            CREATE ACCOUNT
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Wishlist' }]} />
        <h1 className="mt-4 font-brand-display text-3xl font-semibold text-brand-dark">My Wishlist</h1>
        <div className="mt-6">
          <WishlistSkeleton />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: 'Wishlist' }]} />
      <h1 className="mt-4 font-brand-display text-3xl font-semibold text-brand-dark">My Wishlist</h1>

      <div className="mt-6 divide-y divide-brand-border border-y border-brand-border">
        {items.map((item) => (
          <WishlistProductCard key={item.id} item={item} onRemove={handleRemove} onAddToCart={handleAddToCart} />
        ))}
      </div>

      <QuickAddModal product={modalProduct} open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
