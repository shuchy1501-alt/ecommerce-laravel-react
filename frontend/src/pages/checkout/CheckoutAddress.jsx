import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Star } from 'lucide-react'
import * as addressService from '@/api/addressService'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { AddressSkeleton } from '@/components/ui/Skeleton'
import AddressQuickForm from '@/components/store/AddressQuickForm'

const TYPE_LABEL = { home: 'HOME', office: 'OFFICE', other: 'OTHER' }

export default function CheckoutAddress() {
  const { addressId, selectAddress } = useCart()
  const toast = useToast()
  const navigate = useNavigate()

  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(addressId)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    addressService
      .getAll()
      .then(({ data }) => {
        setAddresses(data || [])
        if (!selected) {
          const def = (data || []).find((a) => a.is_default) || data?.[0]
          if (def) setSelected(def.id)
        }
      })
      .catch(() => toast.error('Could not load your addresses.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddressCreated = (newAddress) => {
    setAddresses((prev) => [newAddress, ...prev])
    setSelected(newAddress.id)
    setShowForm(false)
    toast.success('Address added successfully.')
  }

  const handleContinue = async () => {
    if (!selected) {
      toast.warning('Please select an address to continue.')
      return
    }
    setSaving(true)
    try {
      await selectAddress(selected)
      navigate('/checkout/shipping')
    } catch (err) {
      toast.error(err.message || 'Could not select this address.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AddressSkeleton />

  return (
    <div className="space-y-6">
      <h1 className="font-brand-display text-xl font-semibold text-brand-dark">Select a delivery address</h1>

      {addresses.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-brand-border bg-white px-6 py-12 text-center">
          <p className="text-sm text-gray-500">You haven't saved any addresses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a.id)}
              className={`rounded-xl border-2 p-4 text-left transition-colors ${
                selected === a.id ? 'border-brand-primary bg-brand-light' : 'border-brand-border bg-white hover:border-brand-dark'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded bg-white px-2 py-1 text-[11px] font-bold tracking-wide text-brand-dark">
                  {TYPE_LABEL[a.address_type] || 'OTHER'}
                </span>
                {a.is_default && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-brand-success">
                    <Star size={11} className="fill-current" /> Default
                  </span>
                )}
              </div>
              <p className="font-medium text-brand-dark">{a.full_name}</p>
              <p className="text-sm text-gray-500">{a.phone}</p>
              <p className="mt-1 text-sm text-gray-600">{a.address_line_1}{a.address_line_2 ? `, ${a.address_line_2}` : ''}</p>
              <p className="text-sm text-gray-600">{[a.city, a.state, a.postal_code].filter(Boolean).join(', ')}</p>
            </button>
          ))}
        </div>
      )}

      {showForm ? (
        <AddressQuickForm onSuccess={handleAddressCreated} onCancel={() => setShowForm(false)} />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
        >
          <Plus size={16} /> Add New Address
        </button>
      )}

      <div className="flex justify-end border-t border-brand-border pt-4">
        <button
          onClick={handleContinue}
          disabled={saving || !selected}
          className="rounded-md bg-brand-primary px-8 py-3 text-sm font-semibold text-white hover:bg-brand-primary-dark disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'CONTINUE TO SHIPPING'}
        </button>
      </div>
    </div>
  )
}
