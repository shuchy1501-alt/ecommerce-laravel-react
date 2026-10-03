import api from './axios'

/* Payment service (Phase 9) — sandbox gateway until a real provider is configured. */

export async function initializePayment(orderId) {
  const { data } = await api.post('/payments/initialize', { order_id: orderId })
  return data
}

export async function verifyPayment(transactionId, signature) {
  const { data } = await api.post('/payments/verify', { transaction_id: transactionId, signature })
  return data
}

export async function retryPayment(paymentId) {
  const { data } = await api.post(`/payments/${paymentId}/retry`)
  return data
}
