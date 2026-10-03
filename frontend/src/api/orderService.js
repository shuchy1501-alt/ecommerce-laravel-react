import api from './axios'

/* Order service (Phase 9). Orders are always created from the current cart — never from a raw items list. */

export async function getOrders(params = {}) {
  const { data } = await api.get('/orders', { params })
  return data
}

export async function getOrder(id) {
  const { data } = await api.get(`/orders/${id}`)
  return data
}

function getIdempotencyKey() {
  const key = `fm_order_attempt_${Date.now()}_${Math.random().toString(36).slice(2)}`
  return key
}

export async function placeOrder(paymentMethod) {
  const idempotencyKey = sessionStorage.getItem('fm_pending_order_key') || getIdempotencyKey()
  sessionStorage.setItem('fm_pending_order_key', idempotencyKey)

  const { data } = await api.post('/orders', {
    payment_method: paymentMethod,
    idempotency_key: idempotencyKey,
  })

  // Order successfully created (or the same one returned via idempotency) — safe to clear the guard.
  sessionStorage.removeItem('fm_pending_order_key')
  return data
}

export async function cancelOrder(id, reason) {
  const { data } = await api.post(`/orders/${id}/cancel`, { reason })
  return data
}

export async function getInvoice(orderId) {
  const { data } = await api.get(`/orders/${orderId}/invoice`)
  return data
}
