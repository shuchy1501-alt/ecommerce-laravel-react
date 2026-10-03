import api from './axios'

/* Customer-facing return / exchange / refund service (Phase 11). */

export async function getReturns(params = {}) {
  const { data } = await api.get('/returns', { params })
  return data
}

export async function getReturn(id) {
  const { data } = await api.get(`/returns/${id}`)
  return data
}

export async function createReturn(orderId, payload) {
  const { data } = await api.post(`/orders/${orderId}/returns`, payload)
  return data
}

export async function createExchange(orderId, payload) {
  const { data } = await api.post(`/orders/${orderId}/exchange`, payload)
  return data
}

export async function cancelReturn(id, reason) {
  const { data } = await api.post(`/returns/${id}/cancel`, { reason })
  return data
}

export async function getRefunds(params = {}) {
  const { data } = await api.get('/refunds', { params })
  return data
}

export async function getRefund(id) {
  const { data } = await api.get(`/refunds/${id}`)
  return data
}
