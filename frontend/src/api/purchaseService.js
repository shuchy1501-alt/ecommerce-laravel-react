import api from './axios'

export function getPurchases(params = {}) {
  return api.get('/admin/purchases', { params }).then((res) => res.data)
}

export function getPurchase(id) {
  return api.get(`/admin/purchases/${id}`).then((res) => res.data)
}

export function createPurchase(payload) {
  return api.post('/admin/purchases', payload).then((res) => res.data)
}

export function updatePurchase(id, payload) {
  return api.put(`/admin/purchases/${id}`, payload).then((res) => res.data)
}

export function receivePurchase(id, items) {
  return api.post(`/admin/purchases/${id}/receive`, items ? { items } : {}).then((res) => res.data)
}

export function cancelPurchase(id) {
  return api.post(`/admin/purchases/${id}/cancel`).then((res) => res.data)
}
