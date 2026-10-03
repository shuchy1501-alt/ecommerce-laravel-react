import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as wishlistService from '@/api/wishlistService'
import { useAuth } from './AuthContext'

const WishlistContext = createContext(null)

/*
 * Phase 7: the wishlist is customer-specific and lives on the backend.
 * Guests never get a local/localStorage wishlist (spec section 51) — toggling
 * while logged out resolves to { requiresAuth: true } so the caller (e.g.
 * ProductCard) can prompt for login instead of silently storing anything.
 */
export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([])
      return
    }
    setLoading(true)
    try {
      const { data } = await wishlistService.getWishlist()
      setItems(data || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refresh()
  }, [refresh])

  const isWishlisted = (productId) => items.some((i) => i.product_id === productId)

  const toggle = async (productId) => {
    if (!isAuthenticated) {
      return { requiresAuth: true }
    }

    const wasWishlisted = isWishlisted(productId)
    // Optimistic update so the heart icon flips instantly.
    setItems((prev) =>
      wasWishlisted ? prev.filter((i) => i.product_id !== productId) : [...prev, { product_id: productId, product: null }]
    )

    try {
      const { data } = await wishlistService.toggle(productId)
      await refresh()
      return { requiresAuth: false, inWishlist: data?.in_wishlist }
    } catch (err) {
      // Roll back on failure.
      await refresh()
      throw err
    }
  }

  const remove = async (productId) => {
    await wishlistService.remove(productId)
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
  }

  return (
    <WishlistContext.Provider value={{ items, isWishlisted, toggle, remove, refresh, loading, count: items.length }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
