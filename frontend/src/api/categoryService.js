import api from './axios'

/**
 * Categories service (Phase 6). Talks to the real Laravel catalog API —
 * no mock fallback, since /admin/categories requires the real backend.
 */

export function getCategories(params = {}) {
  return api.get('/categories', { params }).then((res) => res.data)
}

export function getActiveCategories() {
  return api.get('/categories/active').then((res) => res.data)
}

export function getCategory(id) {
  return api.get(`/categories/${id}`).then((res) => res.data)
}

export function getSubcategoriesForCategory(categoryId) {
  return api.get(`/categories/${categoryId}/subcategories`).then((res) => res.data)
}

function toFormData(payload) {
  const form = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    form.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value)
  })
  return form
}

export function createCategory(payload) {
  return api.post('/categories', toFormData(payload)).then((res) => res.data)
}

export function updateCategory(id, payload) {
  return api.post(`/categories/${id}`, toFormData(payload)).then((res) => res.data)
}

export function deleteCategory(id) {
  return api.delete(`/categories/${id}`).then((res) => res.data)
}
