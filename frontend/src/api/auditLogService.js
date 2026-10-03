import api from './axios'

export async function fetchAuditLogs(params = {}) {
  const { data } = await api.get('/admin/audit-logs', { params })
  return data
}
