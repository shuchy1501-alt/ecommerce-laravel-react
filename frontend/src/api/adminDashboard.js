import api from './axios'

/** Phase 13A — GET /api/admin/dashboard */
export function fetchAdminDashboard(params = {}) {
  return api.get('/admin/dashboard', { params }).then((res) => res.data)
}
