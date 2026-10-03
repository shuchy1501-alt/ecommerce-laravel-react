import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await login(form)
      toast.success('Signed in successfully.')
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
      } else {
        toast.error(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-stone">Access your FashionMart console.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          name="email"
          required
          value={form.email}
          onChange={handleChange}
          error={errors.email?.[0]}
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          name="password"
          required
          value={form.password}
          onChange={handleChange}
          error={errors.password?.[0]}
          autoComplete="current-password"
        />
        <Button type="submit" variant="accent" loading={loading} className="mt-2 w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-stone">
        Need access?{' '}
        <Link to="/register" className="font-medium text-oxblood hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
