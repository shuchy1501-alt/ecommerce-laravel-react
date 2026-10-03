import api from './axios'

/*
 * Settings service (Phase 13C). All sections live behind
 * /api/admin/settings/*, gated server-side by settings.view / settings.update
 * permissions. Payment gateway secret fields are write-only: the API never
 * returns their real values (see backend SettingService), so the UI should
 * treat those inputs as "leave blank to keep unchanged".
 */

export async function getAllSettings() {
  const { data } = await api.get('/admin/settings')
  return data
}

const SECTIONS = [
  'general',
  'store',
  'order',
  'payment',
  'shipping',
  'return',
  'tax',
  'notification',
  'seo',
]

function endpointFor(section) {
  if (!SECTIONS.includes(section)) {
    throw new Error(`Unknown settings section: ${section}`)
  }
  // The backend route for "return" is /admin/settings/return (method name
  // returnSettings() avoids the PHP reserved word, but the URL is plain).
  return `/admin/settings/${section}`
}

export async function getSettingSection(section) {
  const { data } = await api.get(endpointFor(section))
  return data
}

export async function updateSettingSection(section, payload) {
  const { data } = await api.post(endpointFor(section), payload)
  return data
}
