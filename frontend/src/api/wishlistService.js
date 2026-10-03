import api from './axios'

/*
 * Wishlist service (Phase 5, wired to the real backend in Phase 7).
 * WishlistContext now owns the authenticated/guest branching — this file
 * only talks to the API.
 */

export async function getWishlist() {
  const { data } = await api.get('/wishlist')
  return data
}

export async function add(productId, variantId = null) {
  const { data } = await api.post('/wishlist', { product_id: productId, variant_id: variantId })
  return data
}

export async function remove(productId) {
  const { data } = await api.delete(`/wishlist/${productId}`)
  return data
}

export async function check(productId) {
  const { data } = await api.get(`/wishlist/check/${productId}`)
  return data
}

export async function toggle(productId) {
  const { data } = await api.post(`/wishlist/toggle/${productId}`)
  return data
}
