import api from './axios'

export function getSuppliers(params = {}) {
  return api.get('/suppliers', { params }).then((res) => res.data)
}

export function getActiveSuppliers() {
  return api.get('/suppliers/active').then((res) => res.data)
}

export function getSupplier(id) {
  return api.get(`/suppliers/${id}`).then((res) => res.data)
}

export function createSupplier(payload) {
  return api.post('/suppliers', payload).then((res) => res.data)
}

export function updateSupplier(id, payload) {
  return api.put(`/suppliers/${id}`, payload).then((res) => res.data)
}

export function deleteSupplier(id) {
  return api.delete(`/suppliers/${id}`).then((res) => res.data)
}
