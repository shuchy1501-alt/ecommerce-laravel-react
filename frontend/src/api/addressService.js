import api from './axios'

/* Customer address book (Phase 7). */

export async function getAll() {
  const { data } = await api.get('/customer/addresses')
  return data
}

export async function get(id) {
  const { data } = await api.get(`/customer/addresses/${id}`)
  return data
}

export async function create(payload) {
  const { data } = await api.post('/customer/addresses', payload)
  return data
}

export async function update(id, payload) {
  const { data } = await api.put(`/customer/addresses/${id}`, payload)
  return data
}

export async function remove(id) {
  const { data } = await api.delete(`/customer/addresses/${id}`)
  return data
}

export async function setDefault(id) {
  const { data } = await api.patch(`/customer/addresses/${id}/default`)
  return data
}
