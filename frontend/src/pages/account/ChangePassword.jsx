import { useState } from 'react'
import * as customerService from '@/api/customerService'
import { useToast } from '@/context/ToastContext'

const fieldClass =
  'w-full rounded-md border border-brand-border px-3.5 py-2.5 text-sm text-brand-dark focus:border-brand-primary focus:outline-none'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500'

const EMPTY = { current_password: '', new_password: '', new_password_confirmation: '' }

export default function ChangePassword() {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    try {
      await customerService.changePassword(form)
      toast.success('Password changed successfully.')
      setForm(EMPTY)
    } catch (err) {
      if (err.status === 422) {
        setErrors(err.response?.data?.errors || {})
      }
      toast.error(err.message || 'Could not change your password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-brand-display text-2xl font-semibold text-brand-dark">Change Password</h1>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-xl border border-brand-border bg-white p-6" noValidate>
        <div>
          <label className={labelClass}>Current Password <span className="text-brand-danger">*</span></label>
          <input
            type="password"
            name="current_password"
            value={form.current_password}
            onChange={handleChange}
            required
            autoComplete="current-password"
            className={fieldClass}
          />
          {errors.current_password && <p className="mt-1 text-xs text-brand-danger">{errors.current_password[0]}</p>}
        </div>
        <div>
          <label className={labelClass}>New Password <span className="text-brand-danger">*</span></label>
          <input
            type="password"
            name="new_password"
            value={form.new_password}
            onChange={handleChange}
            required
            autoComplete="new-password"
            className={fieldClass}
          />
          {errors.new_password && <p className="mt-1 text-xs text-brand-danger">{errors.new_password[0]}</p>}
        </div>
        <div>
          <label className={labelClass}>Confirm New Password <span className="text-brand-danger">*</span></label>
          <input
            type="password"
            name="new_password_confirmation"
            value={form.new_password_confirmation}
            onChange={handleChange}
            required
            autoComplete="new-password"
            className={fieldClass}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-brand-primary py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-dark disabled:opacity-60"
        >
          {saving ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
