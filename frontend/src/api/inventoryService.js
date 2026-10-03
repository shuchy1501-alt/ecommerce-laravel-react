import api from './axios'

export function getOverview() {
  return api.get('/admin/inventory').then((res) => res.data)
}

export function getStock(params = {}) {
  return api.get('/admin/inventory/stock', { params }).then((res) => res.data)
}

export function getStockDetail(variantId, params = {}) {
  return api.get(`/admin/inventory/stock/${variantId}`, { params }).then((res) => res.data)
}

export function getMovements(params = {}) {
  return api.get('/admin/inventory/movements', { params }).then((res) => res.data)
}

export function adjustStock(payload) {
  return api.post('/admin/inventory/adjustments', payload).then((res) => res.data)
}
