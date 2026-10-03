import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

/**
 * Authentication strategy (Phase 1 correction): Sanctum Personal Access
 * Tokens sent as `Authorization: Bearer {token}`. No cookie/CSRF-based
 * session is used, so `withCredentials` stays false and there is no
 * separate "get CSRF cookie" step before login — see api/auth.js.
 *
 * This is the ONLY place the token is attached to requests; components and
 * pages should never set the Authorization header themselves.
 *
 * Guest carts (Phase 8): since there's no server session to key a guest
 * cart on, the browser generates its own id once and sends it as
 * X-Guest-Cart-Id on every request. The backend only ever uses this header
 * when there's no authenticated user attached to the token.
 */
const GUEST_CART_KEY = 'fm_guest_cart_id'

export function getGuestCartId() {
  let id = localStorage.getItem(GUEST_CART_KEY)
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)
    localStorage.setItem(GUEST_CART_KEY, id)
  }
  return id
}

const api = axios.create({
  baseURL,
  withCredentials: false,
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fm_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    config.headers['X-Guest-Cart-Id'] = getGuestCartId()
  }
  return config
})

// Normalize errors and handle 401s (expired/invalid/revoked token) in one place
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status

    if (status === 401) {
      localStorage.removeItem('fm_token')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }

    // Standard fallback copy per status code (spec: section 57 — API Error
    // Handling). A backend-provided message always wins; these only fill in
    // when the response has none, so every page gets consistent wording
    // without every component re-implementing the same switch statement.
    const STATUS_FALLBACKS = {
      403: 'You do not have permission to perform this action.',
      404: 'The requested item could not be found.',
      422: 'Please correct the highlighted fields.',
      500: 'Something went wrong. Please try again.',
    }

    const message =
      error?.response?.data?.message ||
      error?.response?.data?.errors?.[Object.keys(error?.response?.data?.errors || {})[0]]?.[0] ||
      STATUS_FALLBACKS[status] ||
      error.message ||
      'Something went wrong. Please try again.'

    return Promise.reject({ ...error, message, status })
  }
)

export default api
