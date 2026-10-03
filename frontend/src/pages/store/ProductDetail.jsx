import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import Breadcrumb from '@/components/store/Breadcrumb'
import ProductGallery from '@/components/store/ProductGallery'
import RatingStars from '@/components/store/RatingStars'
import SizeSelector from '@/components/store/SizeSelector'
import ColorSelector from '@/components/store/ColorSelector'
import QuantitySelector from '@/components/store/QuantitySelector'
import StockBadge from '@/components/store/StockBadge'
import ProductTabs from '@/components/store/ProductTabs'
import ProductSection from '@/components/store/ProductSection'
import { getProductBySlugApi, getProducts } from '@/api/productService'
import { getRelatedProducts } from '@/data/mockProducts'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useToast } from '@/context/ToastContext'

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { addItem } = useCart()
  const { isWishlisted, toggle } = useWishlist()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [size, setSize] = useState(null)
  const [color, setColor] = useState(null)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    let active = true
    setLoading(true)
    setNotFound(false)
    setSize(null)
    setColor(null)
    setQuantity(1)

    getProductBySlugApi(slug)
      .then((p) => {
        if (!active) return
        if (!p) {
          setNotFound(true)
          return
        }
        setProduct(p)
        setRelated(getRelatedProducts(p))
        // Warm the related-products cache from the live/mock product API too.
        getProducts({ category: p.category, per_page: 4 }).catch(() => {})
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false))

    return () => { active = false }
  }, [slug])

  const variant = useMemo(() => {
    if (!product || !size || !color) return null
    return product.variants.find((v) => v.size === size && v.color === color) || null
  }, [product, size, color])

  const sizeAvailable = (s) => product?.variants.some((v) => v.size === s && v.stock > 0)
  const colorAvailable = (c) => product?.variants.some((v) => v.color === c && v.stock > 0)
  const canAdd = variant && variant.stock > 0
  const wishlisted = product ? isWishlisted(product.id) : false

  const requireVariant = () => {
    if (!size || !color) {
      toast.warning('Please select a size and color.')
      return false
    }
    if (!canAdd) {
      toast.error('This combination is out of stock.')
      return false
    }
    return true
  }

  const handleAddToCart = async () => {
    if (!requireVariant()) return
    try {
      await addItem(product.id, variant.id, quantity)
      toast.success('Product added to cart.')
    } catch (err) {
      toast.error(err.message || 'Could not add this product to your cart.')
    }
  }

  const handleBuyNow = async () => {
    if (!requireVariant()) return
    try {
      await addItem(product.id, variant.id, quantity)
      navigate('/cart')
    } catch (err) {
      toast.error(err.message || 'Could not add this product to your cart.')
    }
  }

  const handleWishlist = async () => {
    try {
      const result = await toggle(product.id)
      if (result?.requiresAuth) {
        toast.info('Please login to save products to your wishlist.', { duration: 6000 })
        navigate('/login', { state: { from: { pathname: `/product/${slug}` } } })
        return
      }
      toast[wishlisted ? 'info' : 'success'](wishlisted ? 'Removed from wishlist.' : 'Added to wishlist.')
    } catch {
      toast.error('Could not update your wishlist. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="aspect-square rounded-lg bg-brand-border/50" />
          <div className="space-y-4">
            <div className="h-4 w-24 rounded bg-brand-border/50" />
            <div className="h-8 w-2/3 rounded bg-brand-border/50" />
            <div className="h-6 w-32 rounded bg-brand-border/50" />
          </div>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-brand-display text-2xl font-semibold text-brand-dark">Product not found</h1>
        <p className="mt-2 text-sm text-gray-500">This item may have been removed or the link is incorrect.</p>
        <Link to="/shop" className="mt-6 inline-block rounded-md bg-brand-primary px-6 py-3 text-sm font-semibold text-white">Continue Shopping</Link>
      </div>
    )
  }

  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : null
  const displayPrice = variant?.price ?? product.price
  const displayStock = variant?.stock
  const displaySku = variant?.sku ?? '—'

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: 'Shop', href: '/shop' }, { label: product.name }]} />

      <div className="mt-5 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{product.brand}</span>
          <h1 className="mt-1 font-brand-display text-3xl font-semibold text-brand-dark">{product.name}</h1>

          <div className="mt-2 flex items-center gap-3">
            <RatingStars rating={product.rating} reviewCount={product.reviewCount} size={16} />
            <span className="text-xs text-gray-400">SKU: {displaySku}</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-brand-display text-3xl font-semibold text-brand-dark">৳{displayPrice.toLocaleString()}</span>
            {product.oldPrice && (
              <>
                <span className="text-lg text-gray-400 line-through">৳{product.oldPrice.toLocaleString()}</span>
                <span className="rounded bg-brand-danger px-2 py-0.5 text-xs font-bold text-white">{discount}% OFF</span>
              </>
            )}
          </div>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-600">{product.description}</p>

          <div className="mt-6 space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-brand-dark">Color {color && <span className="font-normal text-gray-500">— {color}</span>}</p>
              <ColorSelector colors={product.colors} selected={color} onSelect={setColor} isAvailable={colorAvailable} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-brand-dark">Size {size && <span className="font-normal text-gray-500">— {size}</span>}</p>
              <SizeSelector sizes={product.sizes} selected={size} onSelect={setSize} isAvailable={sizeAvailable} />
            </div>

            {variant && <StockBadge stock={displayStock} minStock={product.minStock} />}

            <div>
              <p className="mb-2 text-sm font-medium text-brand-dark">Quantity</p>
              <QuantitySelector value={quantity} onChange={setQuantity} max={variant ? variant.stock : 10} />
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleAddToCart}
              disabled={!!variant && !canAdd}
              className="flex-1 rounded-md bg-brand-primary py-3.5 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              ADD TO CART
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!!variant && !canAdd}
              className="flex-1 rounded-md border border-brand-dark py-3.5 text-sm font-semibold tracking-wide text-brand-dark transition-colors hover:bg-brand-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              BUY NOW
            </button>
            <button
              onClick={handleWishlist}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={wishlisted}
              className="flex items-center justify-center rounded-md border border-brand-border px-4 py-3.5 text-brand-dark hover:border-brand-primary"
            >
              <Heart size={20} className={wishlisted ? 'fill-brand-primary text-brand-primary' : ''} />
            </button>
          </div>
        </div>
      </div>

      <ProductTabs product={product} />

      {related.length > 0 && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8">
          <ProductSection title="You May Also Like" products={related} />
        </div>
      )}
    </div>
  )
}
