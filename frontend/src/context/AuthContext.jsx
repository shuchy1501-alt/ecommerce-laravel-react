import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import * as authApi from '@/api/auth'

const AuthContext = createContext(null)

/*
 * Authentication strategy (Phase 1 correction): the Sanctum Bearer token
 * is stored under `fm_token` in localStorage and read only in one place —
 * api/axios.js's request interceptor. Nothing else in the app should read
 * or attach this token directly.
 */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('fm_token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const { data } = await authApi.fetchMe()
      setUser(data?.data?.user ?? data?.user ?? null)
      setPermissions(data?.data?.permissions ?? data?.permissions ?? [])
    } catch {
      localStorage.removeItem('fm_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials)
    const token = data?.data?.token ?? data?.token
    if (token) localStorage.setItem('fm_token', token)
    setUser(data?.data?.user ?? data?.user ?? null)
    setPermissions(data?.data?.permissions ?? data?.permissions ?? [])
    return data
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      localStorage.removeItem('fm_token')
      setUser(null)
      setPermissions([])
    }
  }

  const can = (permission) => permissions.includes(permission)

  return (
    <AuthContext.Provider
      value={{ user, permissions, loading, login, logout, can, isAuthenticated: !!user, refreshUser: loadUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
