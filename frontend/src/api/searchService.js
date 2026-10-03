import api from './axios'

/* Global admin search (Phase 13D). Backend is permission-aware per category — the response only includes sections the caller can see. */

export async function globalSearch(q) {
  const { data } = await api.get('/admin/search', { params: { q } })
  return data
}

export async function searchByType(type, q, params = {}) {
  const { data } = await api.get(`/admin/search/${type}`, { params: { q, ...params } })
  return data
}
