import api from './axios'

/*
 * Authentication strategy (Phase 1 correction): Bearer token only. There is
 * no CSRF-cookie step before login — that belonged to Sanctum's cookie/SPA
 * flow, which this project does not use (see api/axios.js).
 */

export const login = (credentials) => api.post('/auth/login', credentials)
export const logout = () => api.post('/auth/logout')
export const register = (payload) => api.post('/auth/register', payload)
export const fetchMe = () => api.get('/auth/me')
