import api from './axios'

/* Checkout service (Phase 8). No order/payment creation — that's Phase 9. */

export async function getShippingMethods() {
  const { data } = await api.get('/shipping-methods')
  return data
}

export async function validateCheckout() {
  const { data } = await api.post('/checkout/validate')
  return data
}
