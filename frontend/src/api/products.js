import api from './axios'

/**
 * Thin wrapper around the Products API. Pages should call these
 * instead of using the `api` axios instance directly, so the request
 * shape stays in one place if the backend contract changes.
 */

export function fetchProducts(params = {}) {
  return api.get('/products', { params }).then((res) => res.data)
}

export function fetchProduct(id) {
  return api.get(`/products/${id}`).then((res) => res.data)
}

export function createProduct(payload) {
  return api.post('/products', payload).then((res) => res.data)
}

export function updateProduct(id, payload) {
  return api.put(`/products/${id}`, payload).then((res) => res.data)
}

export function deleteProduct(id) {
  return api.delete(`/products/${id}`).then((res) => res.data)
}
