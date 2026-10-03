import api from './axios'

export function getBrands(params = {}) {
  return api.get('/brands', { params }).then((res) => res.data)
}

export function getActiveBrands() {
  return api.get('/brands/active').then((res) => res.data)
}

export function getBrand(id) {
  return api.get(`/brands/${id}`).then((res) => res.data)
}

function toFormData(payload) {
  const form = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    form.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value)
  })
  return form
}

export function createBrand(payload) {
  return api.post('/brands', toFormData(payload)).then((res) => res.data)
}

export function updateBrand(id, payload) {
  return api.post(`/brands/${id}`, toFormData(payload)).then((res) => res.data)
}

export function deleteBrand(id) {
  return api.delete(`/brands/${id}`).then((res) => res.data)
}
