import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as cartService from '@/api/cartService'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

const EMPTY_CART = {
  items: [],
  item_count: 0,
  total_quantity: 0,
  subtotal: 0,
  discount: 0,
  shipping: 0,
  tax: 0,
  total: 0,
  coupon: null,
  shipping_method: null,
  address_id: null,
}

/*
 * Phase 8: the cart lives on the backend for both guests (keyed by a
 * client-generated X-Guest-Cart-Id, see api/axios.js) and authenticated
 * customers (keyed by user_id). This context is a thin reactive wrapper —
 * every mutation calls the API and replaces local state with exactly what
 * the server returns, so price/stock/totals are never computed here.
 */
export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [cart, setCart] = useState(EMPTY_CART)
  const [loading, setLoading] = useState(true)
  const [mutating, setMutating] = useState(false)

  const applyResponse = (res) => {
    setCart(res?.data || EMPTY_CART)
    return res?.data
  }

  const fetchCart = useCallback(async () => {
    setLoading(true)
    try {
      const res = await cartService.getCart()
      applyResponse(res)
    } catch {
      setCart(EMPTY_CART)
    } finally {
      setLoading(false)
    }
  }, [])

  // Merge the guest cart into the customer's cart exactly once when a
  // session transitions from guest -> logged in, then reload.
  const prevAuthRef = useState({ current: isAuthenticated })[0]
  useEffect(() => {
    const wasAuthenticated = prevAuthRef.current
    prevAuthRef.current = isAuthenticated

    if (!wasAuthenticated && isAuthenticated) {
      cartService
        .mergeGuestCart()
        .then(applyResponse)
        .catch(() => fetchCart())
    } else {
      fetchCart()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const runMutation = async (fn) => {
    setMutating(true)
    try {
      const res = await fn()
      return applyResponse(res)
    } finally {
      setMutating(false)
    }
  }

  const addItem = (productId, variantId, quantity = 1) =>
    runMutation(() => cartService.addToCart({ productId, variantId, quantity }))

  const updateQuantity = (itemId, quantity) => runMutation(() => cartService.updateCartItem(itemId, quantity))

  const removeItem = (itemId) => runMutation(() => cartService.removeCartItem(itemId))

  const clearCart = () => runMutation(() => cartService.clearCart())

  const moveToWishlist = (itemId) => runMutation(() => cartService.moveToWishlist(itemId))

  const validateCart = async () => {
    setMutating(true)
    try {
      const res = await cartService.validateCart()
      // This endpoint returns { valid, errors, cart } — not a flat cart
      // resource — so it must NOT go through applyResponse() as-is.
      const payload = res?.data
      setCart(payload?.cart || EMPTY_CART)
      return payload
    } finally {
      setMutating(false)
    }
  }

  const applyCoupon = (code) => runMutation(() => cartService.applyCoupon(code))

  const removeCoupon = () => runMutation(() => cartService.removeCoupon())

  const selectShippingMethod = (id) => runMutation(() => cartService.selectShippingMethod(id))

  const selectAddress = (id) => runMutation(() => cartService.selectAddress(id))

  return (
    <CartContext.Provider
      value={{
        cart,
        items: cart.items,
        loading,
        mutating,
        itemCount: cart.total_quantity,
        subtotal: cart.subtotal,
        discount: cart.discount,
        shipping: cart.shipping,
        total: cart.total,
        coupon: cart.coupon,
        shippingMethod: cart.shipping_method,
        addressId: cart.address_id,
        fetchCart,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        moveToWishlist,
        validateCart,
        applyCoupon,
        removeCoupon,
        selectShippingMethod,
        selectAddress,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
