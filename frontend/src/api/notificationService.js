import api from './axios'

/* Notification service (Phase 13C). Shared by both admin and customer UIs — the backend scopes every route to the authenticated user's own notifications. */

export async function getNotifications(params = {}) {
  const { data } = await api.get('/notifications', { params })
  return data
}

export async function markNotificationRead(id) {
  const { data } = await api.post(`/notification/${id}/read`)
  return data
}

export async function markAllNotificationsRead() {
  const { data } = await api.post('/notifications/read-all')
  return data
}

export async function deleteNotification(id) {
  const { data } = await api.delete(`/notification/${id}`)
  return data
}
