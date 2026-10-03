import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerApi } from '@/api/auth'
import { useToast } from '@/context/ToastContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function Register() {
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await registerApi(form)
      toast.success('Account created. Please sign in.')
      navigate('/login')
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
      <h1 className="font-display text-2xl text-ink">Create account</h1>
      <p className="mt-1 text-sm text-stone">Set up access to the FashionMart console.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input label="Full name" name="name" required value={form.name} onChange={handleChange} error={errors.name?.[0]} />
        <Input label="Email" type="email" name="email" required value={form.email} onChange={handleChange} error={errors.email?.[0]} />
        <Input label="Password" type="password" name="password" required value={form.password} onChange={handleChange} error={errors.password?.[0]} />
        <Input
          label="Confirm password"
          type="password"
          name="password_confirmation"
          required
          value={form.password_confirmation}
          onChange={handleChange}
        />
        <Button type="submit" variant="accent" loading={loading} className="mt-2 w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-stone">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-oxblood hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
