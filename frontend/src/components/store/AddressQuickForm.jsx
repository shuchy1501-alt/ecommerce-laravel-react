import { useState } from 'react'
import * as addressService from '@/api/addressService'
import { useToast } from '@/context/ToastContext'

const fieldClass =
  'w-full rounded-md border border-brand-border px-3.5 py-2.5 text-sm text-brand-dark focus:border-brand-primary focus:outline-none'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500'

const EMPTY_FORM = {
  full_name: '',
  phone: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'Bangladesh',
  address_type: 'home',
  is_default: false,
}

export default function AddressQuickForm({ onSuccess, onCancel }) {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    try {
      const { data } = await addressService.create(form)
      onSuccess(data)
    } catch (err) {
      const fieldErrors = err.response?.data?.errors
      if (fieldErrors) {
        setErrors(fieldErrors)
      }
      toast.error(err.message || 'Please correct the highlighted fields.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-brand-border bg-white p-5" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Full Name *</label>
          <input name="full_name" value={form.full_name} onChange={handleChange} required className={fieldClass} />
          {errors.full_name && <p className="mt-1 text-xs text-brand-danger">{errors.full_name[0]}</p>}
        </div>
        <div>
          <label className={labelClass}>Phone *</label>
          <input name="phone" value={form.phone} onChange={handleChange} required className={fieldClass} />
          {errors.phone && <p className="mt-1 text-xs text-brand-danger">{errors.phone[0]}</p>}
        </div>
      </div>
      <div>
        <label className={labelClass}>Address Line 1 *</label>
        <input name="address_line_1" value={form.address_line_1} onChange={handleChange} required className={fieldClass} />
        {errors.address_line_1 && <p className="mt-1 text-xs text-brand-danger">{errors.address_line_1[0]}</p>}
      </div>
      <div>
        <label className={labelClass}>Address Line 2</label>
        <input name="address_line_2" value={form.address_line_2} onChange={handleChange} className={fieldClass} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>City *</label>
          <input name="city" value={form.city} onChange={handleChange} required className={fieldClass} />
          {errors.city && <p className="mt-1 text-xs text-brand-danger">{errors.city[0]}</p>}
        </div>
        <div>
          <label className={labelClass}>State / Division</label>
          <input name="state" value={form.state} onChange={handleChange} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Postal Code</label>
          <input name="postal_code" value={form.postal_code} onChange={handleChange} className={fieldClass} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Address Type *</label>
          <select name="address_type" value={form.address_type} onChange={handleChange} className={`${fieldClass} bg-white`}>
            <option value="home">Home</option>
            <option value="office">Office</option>
            <option value="other">Other</option>
          </select>
        </div>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-gray-600">
          <input type="checkbox" name="is_default" checked={form.is_default} onChange={handleChange} className="h-4 w-4 accent-[#E91E63]" />
          Set as default address
        </label>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-md border border-brand-border px-5 py-2 text-sm font-semibold text-brand-dark hover:bg-brand-light">
          CANCEL
        </button>
        <button type="submit" disabled={saving} className="rounded-md bg-brand-primary px-5 py-2 text-sm font-semibold text-white hover:bg-brand-primary-dark disabled:opacity-60">
          {saving ? 'Saving…' : 'SAVE ADDRESS'}
        </button>
      </div>
    </form>
  )
}
