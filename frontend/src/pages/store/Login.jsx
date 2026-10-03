import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await login(form)
      toast.success('Signed in successfully.')
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (err) {
      const fieldErrors = err.response?.data?.errors
      if (fieldErrors) {
        setErrors(fieldErrors)
      }
      toast.error(err.message || 'Unable to sign in. Please check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 lg:mt-0">
      <h1 className="font-brand-display text-3xl font-semibold text-brand-dark">Welcome Back</h1>
      <p className="mt-1 text-sm text-gray-500">Sign in to continue your FashionMart experience.</p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            className="w-full rounded-md border border-brand-border px-3.5 py-2.5 text-sm text-brand-dark focus:border-brand-primary focus:outline-none"
          />
          {errors.email && <p className="mt-1 text-xs text-brand-danger">{errors.email[0]}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            className="w-full rounded-md border border-brand-border px-3.5 py-2.5 text-sm text-brand-dark focus:border-brand-primary focus:outline-none"
          />
          {errors.password && <p className="mt-1 text-xs text-brand-danger">{errors.password[0]}</p>}
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-gray-600">
            <input type="checkbox" name="remember" checked={form.remember} onChange={handleChange} className="h-4 w-4 accent-[#E91E63]" />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-brand-primary hover:underline">Forgot password?</Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-md bg-brand-primary py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-brand-primary-dark disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'LOGIN'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        New to FashionMart?{' '}
        <Link to="/register" className="font-semibold text-brand-primary hover:underline">Create account</Link>
      </p>
    </div>
  )
}
