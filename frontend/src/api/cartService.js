import api, { getGuestCartId } from './axios'

/*
 * Cart service (Phase 8). The backend is now the single source of truth
 * for price/stock/totals — nothing here computes money, it only shapes
 * requests and returns the server's response.
 */

export async function getCart() {
  const { data } = await api.get('/cart')
  return data
}

export async function addToCart({ productId, variantId, quantity }) {
  const { data } = await api.post('/cart/items', {
    product_id: productId,
    variant_id: variantId ?? null,
    quantity,
  })
  return data
}

export async function updateCartItem(itemId, quantity) {
  const { data } = await api.put(`/cart/items/${itemId}`, { quantity })
  return data
}

export async function removeCartItem(itemId) {
  const { data } = await api.delete(`/cart/items/${itemId}`)
  return data
}

export async function clearCart() {
  const { data } = await api.delete('/cart')
  return data
}

export async function moveToWishlist(itemId) {
  const { data } = await api.post(`/cart/items/${itemId}/wishlist`)
  return data
}

export async function validateCart() {
  const { data } = await api.post('/cart/validate')
  return data
}

export async function applyCoupon(couponCode) {
  const { data } = await api.post('/cart/coupon', { coupon_code: couponCode })
  return data
}

export async function removeCoupon() {
  const { data } = await api.delete('/cart/coupon')
  return data
}

export async function selectShippingMethod(shippingMethodId) {
  const { data } = await api.post('/cart/shipping', { shipping_method_id: shippingMethodId })
  return data
}

export async function selectAddress(addressId) {
  const { data } = await api.post('/cart/address', { address_id: addressId })
  return data
}

// Called once right after login/register so a guest's cart carries over.
export async function mergeGuestCart() {
  const { data } = await api.post(
    '/cart/merge',
    {},
    { headers: { 'X-Guest-Cart-Id': getGuestCartId() } }
  )
  return data
}
