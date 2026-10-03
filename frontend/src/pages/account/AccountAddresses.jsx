import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Pencil, Trash2, Star, Plus } from 'lucide-react'
import * as addressService from '@/api/addressService'
import { useToast } from '@/context/ToastContext'
import { AddressSkeleton } from '@/components/ui/Skeleton'

const TYPE_LABEL = { home: 'HOME', office: 'OFFICE', other: 'OTHER' }

export default function AccountAddresses() {
  const toast = useToast()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    addressService
      .getAll()
      .then(({ data }) => setAddresses(data || []))
      .catch(() => toast.error('Could not load your addresses.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSetDefault = async (id) => {
    setBusyId(id)
    try {
      await addressService.setDefault(id)
      toast.success('Default address updated.')
      load()
    } catch (err) {
      toast.error(err.message || 'Could not update default address.')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (id) => {
    setBusyId(id)
    try {
      await addressService.remove(id)
      toast.success('Address deleted successfully.')
      setConfirmId(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Could not delete this address.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-brand-display text-2xl font-semibold text-brand-dark">My Addresses</h1>
        <Link
          to="/account/addresses/create"
          className="flex items-center gap-1.5 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary-dark"
        >
          <Plus size={16} /> Add New Address
        </Link>
      </div>

      {loading ? (
        <AddressSkeleton />
      ) : addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-border bg-white px-6 py-16 text-center">
          <MapPin size={36} className="mx-auto text-brand-border" />
          <p className="mt-3 text-sm text-gray-500">You haven't saved any addresses yet.</p>
          <Link to="/account/addresses/create" className="mt-4 inline-block rounded-md bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-dark">
            Add Your First Address
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className="relative rounded-xl border border-brand-border bg-white p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded bg-brand-light px-2 py-1 text-[11px] font-bold tracking-wide text-brand-dark">
                  {TYPE_LABEL[a.address_type] || 'OTHER'}
                </span>
                {a.is_default && (
                  <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[11px] font-semibold text-brand-success">
                    <Star size={11} className="fill-current" /> Default
                  </span>
                )}
              </div>
              <p className="font-medium text-brand-dark">{a.full_name}</p>
              <p className="text-sm text-gray-500">{a.phone}</p>
              <p className="mt-1 text-sm text-gray-600">
                {a.address_line_1}
                {a.address_line_2 ? `, ${a.address_line_2}` : ''}
              </p>
              <p className="text-sm text-gray-600">
                {[a.city, a.state, a.postal_code].filter(Boolean).join(', ')}
              </p>
              <p className="text-sm text-gray-600">{a.country}</p>

              <div className="mt-4 flex items-center gap-4 border-t border-brand-border pt-3 text-sm">
                <Link to={`/account/addresses/${a.id}/edit`} className="flex items-center gap-1 font-medium text-brand-dark hover:text-brand-primary">
                  <Pencil size={14} /> Edit
                </Link>
                {!a.is_default && (
                  <button
                    onClick={() => handleSetDefault(a.id)}
                    disabled={busyId === a.id}
                    className="flex items-center gap-1 font-medium text-brand-dark hover:text-brand-primary disabled:opacity-50"
                  >
                    <Star size={14} /> Set as Default
                  </button>
                )}
                <button
                  onClick={() => setConfirmId(a.id)}
                  className="ml-auto flex items-center gap-1 font-medium text-brand-danger hover:underline"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>

              {confirmId === a.id && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/95 p-5 text-center">
                  <p className="text-sm font-medium text-brand-dark">Are you sure you want to delete this address?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={busyId === a.id}
                      className="rounded-md bg-brand-danger px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {busyId === a.id ? 'Deleting…' : 'Yes, Delete'}
                    </button>
                    <button onClick={() => setConfirmId(null)} className="rounded-md border border-brand-border px-4 py-2 text-xs font-semibold text-brand-dark">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
