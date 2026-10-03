import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, X, Heart, Tag } from 'lucide-react'
import Breadcrumb from '@/components/store/Breadcrumb'
import QuantitySelector from '@/components/store/QuantitySelector'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { CartSkeleton } from '@/components/ui/Skeleton'

export default function Cart() {
  const { isAuthenticated } = useAuth()
  const {
    items,
    loading,
    mutating,
    subtotal,
    discount,
    shipping,
    total,
    coupon,
    updateQuantity,
    removeItem,
    clearCart,
    moveToWishlist,
    validateCart,
    applyCoupon,
    removeCoupon,
  } = useCart()
  const toast = useToast()
  const navigate = useNavigate()

  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [validationWarnings, setValidationWarnings] = useState([])

  // Re-validate against the database once on arrival — spec section 17/58/59:
  // prices/stock may have moved since items were added.
  useEffect(() => {
    if (items.length > 0) {
      validateCart()
        .then((data) => setValidationWarnings(data?.errors || []))
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleQuantityChange = async (item, quantity) => {
    try {
      await updateQuantity(item.id, quantity)
    } catch (err) {
      toast.error(err.message || 'Could not update quantity.')
    }
  }

  const handleRemove = async (item) => {
    try {
      await removeItem(item.id)
      toast.info('Product removed from cart.')
    } catch (err) {
      toast.error(err.message || 'Could not remove this item.')
    }
  }

  const handleMoveToWishlist = async (item) => {
    if (!isAuthenticated) {
      toast.info('Please login to save products to your wishlist.')
      navigate('/login', { state: { from: { pathname: '/cart' } } })
      return
    }
    try {
      await moveToWishlist(item.id)
      toast.success('Moved to wishlist.')
    } catch (err) {
      toast.error(err.message || 'Could not move this item to your wishlist.')
    }
  }

  const handleClearCart = async () => {
    try {
      await clearCart()
      setConfirmClear(false)
      toast.info('Your cart has been cleared.')
    } catch (err) {
      toast.error(err.message || 'Could not clear your cart.')
    }
  }

  const handleApplyCoupon = async (e) => {
    e.preventDefault()
    if (!couponCode.trim()) return
    setApplyingCoupon(true)
    setCouponError('')
    try {
      await applyCoupon(couponCode.trim())
      toast.success('Coupon applied.')
      setCouponCode('')
    } catch (err) {
      setCouponError(err.message || 'Could not apply this coupon.')
    } finally {
      setApplyingCoupon(false)
    }
  }

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon()
      toast.info('Coupon removed.')
    } catch (err) {
      toast.error(err.message || 'Could not remove the coupon.')
    }
  }

  const handleCheckout = async () => {
    try {
      const data = await validateCart()
      if (!data.valid) {
        setValidationWarnings(data.errors || [])
        toast.warning('Please review your cart before checking out.')
        return
      }
      navigate('/checkout')
    } catch (err) {
      toast.error(err.message || 'Could not validate your cart.')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Cart' }]} />
        <h1 className="mt-4 font-brand-display text-3xl font-semibold text-brand-dark">Shopping Cart</h1>
        <div className="mt-6">
          <CartSkeleton />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <ShoppingBag size={48} className="mx-auto text-brand-border" />
        <h1 className="mt-5 font-brand-display text-2xl font-semibold text-brand-dark">Your cart is empty.</h1>
        <p className="mt-2 text-sm text-gray-500">Discover our latest styles and find something you love.</p>
        <Link to="/shop" className="mt-6 inline-block rounded-md bg-brand-primary px-6 py-3 text-sm font-semibold text-white hover:bg-brand-primary-dark">
          SHOP NOW
        </Link>
      </div>
    )
  }

  const hasUnavailable = items.some((i) => !i.available || i.deleted)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: 'Cart' }]} />
      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-brand-display text-3xl font-semibold text-brand-dark">Shopping Cart</h1>
        <button onClick={() => setConfirmClear(true)} className="text-sm font-medium text-brand-danger hover:underline">
          Clear Cart
        </button>
      </div>

      {validationWarnings.length > 0 && (
        <div className="mt-4 space-y-1 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-brand-warning">
          {validationWarnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </div>
      )}

      {confirmClear && (
        <div className="mt-4 flex items-center justify-between rounded-md border border-brand-border bg-white px-4 py-3 text-sm">
          <span>Are you sure you want to remove all items from your cart?</span>
          <div className="flex gap-2">
            <button onClick={handleClearCart} className="rounded-md bg-brand-danger px-4 py-1.5 text-xs font-semibold text-white">Yes, Clear</button>
            <button onClick={() => setConfirmClear(false)} className="rounded-md border border-brand-border px-4 py-1.5 text-xs font-semibold text-brand-dark">Cancel</button>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="divide-y divide-brand-border border-y border-brand-border">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 py-5">
              <Link
                to={item.available ? `/product/${item.slug}` : '#'}
                onClick={(e) => !item.available && e.preventDefault()}
                className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-md bg-brand-light"
              >
                <img
                  src={item.image || 'https://placehold.co/300x400?text=No+Image'}
                  alt={item.name}
                  className={`h-full w-full object-cover ${!item.available ? 'grayscale opacity-60' : ''}`}
                />
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-2">
                  <div>
                    <Link
                      to={item.available ? `/product/${item.slug}` : '#'}
                      onClick={(e) => !item.available && e.preventDefault()}
                      className="text-sm font-medium text-brand-dark hover:text-brand-primary"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-xs text-gray-500">
                      {item.brand} {item.color ? `· ${item.color}` : ''} {item.size ? `· ${item.size}` : ''}
                    </p>
                    {!item.available && (
                      <p className="mt-1 text-xs font-medium text-brand-danger">This product is no longer available.</p>
                    )}
                    {item.available && item.stock <= 0 && (
                      <p className="mt-1 text-xs font-medium text-brand-danger">Out of stock</p>
                    )}
                    {item.available && item.stock > 0 && item.quantity >= item.stock && (
                      <p className="mt-1 text-xs text-brand-warning">Only {item.stock} left</p>
                    )}
                  </div>
                  <button onClick={() => handleRemove(item)} aria-label="Remove item" className="h-fit text-gray-400 hover:text-brand-danger">
                    <X size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <QuantitySelector
                      value={item.quantity}
                      onChange={(q) => handleQuantityChange(item, q)}
                      max={item.stock || 1}
                      size="sm"
                      disabled={!item.available || mutating}
                    />
                    <button onClick={() => handleMoveToWishlist(item)} aria-label="Move to wishlist" className="text-gray-400 hover:text-brand-primary">
                      <Heart size={16} />
                    </button>
                  </div>
                  <span className="font-brand-display text-base font-semibold text-brand-dark">
                    ৳{Number(item.subtotal).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit space-y-4">
          {/* Coupon */}
          <div className="rounded-lg border border-brand-border p-4">
            {coupon ? (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium text-brand-success">
                  <Tag size={14} /> {coupon.code} applied
                </span>
                <button onClick={handleRemoveCoupon} className="text-xs font-medium text-brand-danger hover:underline">
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  className="w-full rounded-md border border-brand-border px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={applyingCoupon}
                  className="whitespace-nowrap rounded-md bg-brand-dark px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {applyingCoupon ? '...' : 'APPLY'}
                </button>
              </form>
            )}
            {couponError && <p className="mt-2 text-xs text-brand-danger">{couponError}</p>}
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-brand-border p-5">
            <h2 className="text-sm font-semibold text-brand-dark">Order Summary</h2>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="text-brand-dark">৳{Number(subtotal).toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-brand-success">
                  <span>Discount</span>
                  <span>-৳{Number(discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-brand-dark">{shipping > 0 ? `৳${Number(shipping).toLocaleString()}` : 'Calculated at checkout'}</span>
              </div>
              <div className="flex justify-between border-t border-brand-border pt-2.5 text-base font-semibold text-brand-dark">
                <span>Estimated Total</span>
                <span>৳{Number(total).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={hasUnavailable || mutating}
              className="mt-5 block w-full rounded-md bg-brand-primary py-3 text-center text-sm font-semibold tracking-wide text-white hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              PROCEED TO CHECKOUT
            </button>
            {hasUnavailable && (
              <p className="mt-2 text-center text-xs text-brand-danger">Remove unavailable items to continue.</p>
            )}
            <Link to="/shop" className="mt-3 block w-full rounded-md border border-brand-border py-3 text-center text-sm font-medium text-brand-dark hover:border-brand-dark">
              CONTINUE SHOPPING
            </Link>
            <p className="mt-3 text-center text-[11px] text-gray-400">Prices are confirmed and validated at checkout.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
