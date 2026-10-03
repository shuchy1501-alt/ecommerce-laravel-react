import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerApi } from '@/api/auth'
import { useToast } from '@/context/ToastContext'

export default function Register() {
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const field = (name, label, type = 'text', autoComplete) => (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required
        value={form[name]}
        onChange={handleChange}
        autoComplete={autoComplete}
        className="w-full rounded-md border border-brand-border px-3.5 py-2.5 text-sm text-brand-dark focus:border-brand-primary focus:outline-none"
      />
      {errors[name] && <p className="mt-1 text-xs text-brand-danger">{errors[name][0]}</p>}
    </div>
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: ['Passwords do not match.'] })
      return
    }

    setLoading(true)
    try {
      await registerApi(form)
      toast.success('Account created. Welcome to FashionMart.')
      navigate('/')
    } catch (err) {
      const fieldErrors = err.response?.data?.errors
      if (fieldErrors) {
        setErrors(fieldErrors)
      }
      toast.error(err.message || 'Unable to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 lg:mt-0">
      <h1 className="font-brand-display text-3xl font-semibold text-brand-dark">Create Account</h1>
      <p className="mt-1 text-sm text-gray-500">Join FashionMart for a faster checkout and order tracking.</p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4" noValidate>
        {field('name', 'Full Name', 'text', 'name')}
        {field('email', 'Email', 'email', 'email')}
        {field('phone', 'Phone', 'tel', 'tel')}
        {field('password', 'Password', 'password', 'new-password')}
        {field('password_confirmation', 'Confirm Password', 'password', 'new-password')}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-md bg-brand-primary py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-brand-primary-dark disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'CREATE ACCOUNT'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-primary hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
