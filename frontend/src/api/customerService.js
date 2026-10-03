import api from './axios'

/* Customer profile + account dashboard (Phase 7). */

export async function getProfile() {
  const { data } = await api.get('/customer/profile')
  return data
}

export async function updateProfile(payload) {
  const { data } = await api.put('/customer/profile', payload)
  return data
}

export async function uploadPhoto(file) {
  const formData = new FormData()
  formData.append('photo', file)
  const { data } = await api.post('/customer/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function removePhoto() {
  const { data } = await api.delete('/customer/profile/photo')
  return data
}

export async function changePassword(payload) {
  const { data } = await api.post('/customer/change-password', payload)
  return data
}

export async function getDashboardStats() {
  const { data } = await api.get('/customer/dashboard/stats')
  return data
}
