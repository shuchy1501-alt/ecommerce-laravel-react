import api from './axios'

export function fetchDashboardStats() {
  return api.get('/dashboard/stats').then((res) => res.data)
}
