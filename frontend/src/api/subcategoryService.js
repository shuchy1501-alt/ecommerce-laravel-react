import api from './axios'

export function getSubcategories(params = {}) {
  return api.get('/subcategories', { params }).then((res) => res.data)
}

export function getSubcategory(id) {
  return api.get(`/subcategories/${id}`).then((res) => res.data)
}

function toFormData(payload) {
  const form = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    form.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value)
  })
  return form
}

export function createSubcategory(payload) {
  return api.post('/subcategories', toFormData(payload)).then((res) => res.data)
}

export function updateSubcategory(id, payload) {
  return api.post(`/subcategories/${id}`, toFormData(payload)).then((res) => res.data)
}

export function deleteSubcategory(id) {
  return api.delete(`/subcategories/${id}`).then((res) => res.data)
}
