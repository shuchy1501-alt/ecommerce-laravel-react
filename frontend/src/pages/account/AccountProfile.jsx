import { useEffect, useRef, useState } from 'react'
import { Camera, Trash2, BadgeCheck } from 'lucide-react'
import * as customerService from '@/api/customerService'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ProfileSkeleton } from '@/components/ui/Skeleton'

function initials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || 'U'
  )
}

const fieldClass =
  'w-full rounded-md border border-brand-border px-3.5 py-2.5 text-sm text-brand-dark focus:border-brand-primary focus:outline-none'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500'

export default function AccountProfile() {
  const { refreshUser } = useAuth()
  const toast = useToast()
  const fileInputRef = useRef(null)

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', date_of_birth: '', gender: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let active = true
    customerService
      .getProfile()
      .then(({ data }) => {
        if (!active) return
        setProfile(data)
        setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          date_of_birth: data.date_of_birth || '',
          gender: data.gender || '',
        })
      })
      .catch(() => toast.error('Could not load your profile.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    try {
      const { data } = await customerService.updateProfile(form)
      setProfile(data)
      toast.success('Profile updated successfully.')
      refreshUser?.()
    } catch (err) {
      if (err.status === 422) {
        setErrors(err.response?.data?.errors || {})
      }
      toast.error(err.message || 'Could not update your profile.')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const { data } = await customerService.uploadPhoto(file)
      setProfile(data)
      toast.success('Profile photo updated successfully.')
      refreshUser?.()
    } catch (err) {
      toast.error(err.message || 'Could not upload photo.')
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const handleRemovePhoto = async () => {
    setUploadingPhoto(true)
    try {
      const { data } = await customerService.removePhoto()
      setProfile(data)
      toast.info('Profile photo removed.')
      refreshUser?.()
    } catch (err) {
      toast.error(err.message || 'Could not remove photo.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  if (loading) return <ProfileSkeleton />

  return (
    <div className="space-y-6">
      <h1 className="font-brand-display text-2xl font-semibold text-brand-dark">My Profile</h1>

      {/* Photo */}
      <div className="flex items-center gap-5 rounded-xl border border-brand-border bg-white p-6">
        <div className="relative">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary text-2xl font-semibold text-white">
              {initials(profile?.name)}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            aria-label="Change profile photo"
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-dark text-white shadow disabled:opacity-60"
          >
            <Camera size={13} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handlePhotoSelect} />
        </div>
        <div>
          <p className="font-medium text-brand-dark">{profile?.name}</p>
          <p className="text-sm text-gray-500">{profile?.email}</p>
          <div className="mt-2 flex items-center gap-3">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto} className="text-xs font-medium text-brand-primary hover:underline">
              Change Photo
            </button>
            {profile?.avatar_url && (
              <button type="button" onClick={handleRemovePhoto} disabled={uploadingPhoto} className="flex items-center gap-1 text-xs font-medium text-brand-danger hover:underline">
                <Trash2 size={12} /> Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Personal information */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-brand-border bg-white p-6" noValidate>
        <h2 className="font-brand-display text-lg font-semibold text-brand-dark">Personal Information</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Full Name <span className="text-brand-danger">*</span></label>
            <input name="name" value={form.name} onChange={handleChange} required className={fieldClass} />
            {errors.name && <p className="mt-1 text-xs text-brand-danger">{errors.name[0]}</p>}
          </div>
          <div>
            <label className={labelClass}>Email <span className="text-brand-danger">*</span></label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required className={fieldClass} />
            {profile?.email_verified ? (
              <span className="mt-1 flex w-fit items-center gap-1 text-xs text-brand-success"><BadgeCheck size={13} /> Verified</span>
            ) : (
              <span className="mt-1 block text-xs text-brand-warning">Not Verified</span>
            )}
            {errors.email && <p className="mt-1 text-xs text-brand-danger">{errors.email[0]}</p>}
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className={fieldClass} />
            {errors.phone && <p className="mt-1 text-xs text-brand-danger">{errors.phone[0]}</p>}
          </div>
          <div>
            <label className={labelClass}>Date of Birth</label>
            <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} className={fieldClass} />
            {errors.date_of_birth && <p className="mt-1 text-xs text-brand-danger">{errors.date_of_birth[0]}</p>}
          </div>
          <div>
            <label className={labelClass}>Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange} className={`${fieldClass} bg-white`}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-dark disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
