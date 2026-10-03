import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import * as addressService from '@/api/addressService'
import { useToast } from '@/context/ToastContext'
import { AddressSkeleton } from '@/components/ui/Skeleton'

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

const fieldClass =
  'w-full rounded-md border border-brand-border px-3.5 py-2.5 text-sm text-brand-dark focus:border-brand-primary focus:outline-none'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500'

export default function AddressForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!isEdit) return
    addressService
      .get(id)
      .then(({ data }) => setForm({ ...EMPTY_FORM, ...data }))
      .catch(() => {
        toast.error('Address not found.')
        navigate('/account/addresses')
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    try {
      if (isEdit) {
        await addressService.update(id, form)
        toast.success('Address updated successfully.')
      } else {
        await addressService.create(form)
        toast.success('Address added successfully.')
      }
      navigate('/account/addresses')
    } catch (err) {
      if (err.status === 422) {
        setErrors(err.response?.data?.errors || {})
      }
      toast.error(err.message || 'Please correct the highlighted fields.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AddressSkeleton count={1} />

  return (
    <div className="space-y-6">
      <div>
        <Link to="/account/addresses" className="text-sm text-gray-500 hover:text-brand-primary">
          ← Back to Addresses
        </Link>
        <h1 className="mt-2 font-brand-display text-2xl font-semibold text-brand-dark">
          {isEdit ? 'Edit Address' : 'Add New Address'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-brand-border bg-white p-6" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Full Name <span className="text-brand-danger">*</span></label>
            <input name="full_name" value={form.full_name} onChange={handleChange} required className={fieldClass} />
            {errors.full_name && <p className="mt-1 text-xs text-brand-danger">{errors.full_name[0]}</p>}
          </div>
          <div>
            <label className={labelClass}>Phone <span className="text-brand-danger">*</span></label>
            <input name="phone" value={form.phone} onChange={handleChange} required className={fieldClass} />
            {errors.phone && <p className="mt-1 text-xs text-brand-danger">{errors.phone[0]}</p>}
          </div>
        </div>

        <div>
          <label className={labelClass}>Address Line 1 <span className="text-brand-danger">*</span></label>
          <input name="address_line_1" value={form.address_line_1} onChange={handleChange} required className={fieldClass} />
          {errors.address_line_1 && <p className="mt-1 text-xs text-brand-danger">{errors.address_line_1[0]}</p>}
        </div>

        <div>
          <label className={labelClass}>Address Line 2</label>
          <input name="address_line_2" value={form.address_line_2 || ''} onChange={handleChange} className={fieldClass} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>City <span className="text-brand-danger">*</span></label>
            <input name="city" value={form.city} onChange={handleChange} required className={fieldClass} />
            {errors.city && <p className="mt-1 text-xs text-brand-danger">{errors.city[0]}</p>}
          </div>
          <div>
            <label className={labelClass}>State / Division</label>
            <input name="state" value={form.state || ''} onChange={handleChange} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Postal Code</label>
            <input name="postal_code" value={form.postal_code || ''} onChange={handleChange} className={fieldClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Country</label>
            <input name="country" value={form.country || ''} onChange={handleChange} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Address Type <span className="text-brand-danger">*</span></label>
            <select name="address_type" value={form.address_type} onChange={handleChange} className={`${fieldClass} bg-white`}>
              <option value="home">Home</option>
              <option value="office">Office</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" name="is_default" checked={!!form.is_default} onChange={handleChange} className="h-4 w-4 accent-[#E91E63]" />
          Set as default address
        </label>

        <div className="flex justify-end gap-3 border-t border-brand-border pt-4">
          <button
            type="button"
            onClick={() => navigate('/account/addresses')}
            className="rounded-md border border-brand-border px-6 py-2.5 text-sm font-semibold text-brand-dark hover:bg-brand-light"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-dark disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'SAVE ADDRESS'}
          </button>
        </div>
      </form>
    </div>
  )
}
