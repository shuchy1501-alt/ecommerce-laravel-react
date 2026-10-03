import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck } from 'lucide-react'
import * as checkoutService from '@/api/checkoutService'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { ShippingSkeleton } from '@/components/ui/Skeleton'

export default function CheckoutShipping() {
  const { shippingMethod, selectShippingMethod } = useCart()
  const toast = useToast()
  const navigate = useNavigate()

  const [methods, setMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(shippingMethod?.id || null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkoutService
      .getShippingMethods()
      .then(({ data }) => {
        setMethods(data || [])
        if (!selected && data?.length) setSelected(data[0].id)
      })
      .catch(() => toast.error('Could not load shipping methods.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleContinue = async () => {
    if (!selected) {
      toast.warning('Please select a shipping method.')
      return
    }
    setSaving(true)
    try {
      await selectShippingMethod(selected)
      navigate('/checkout/review')
    } catch (err) {
      toast.error(err.message || 'Could not select this shipping method.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <ShippingSkeleton />
  }

  return (
    <div className="space-y-6">
      <h1 className="font-brand-display text-xl font-semibold text-brand-dark">Choose a shipping method</h1>

      <div className="space-y-3">
        {methods.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelected(m.id)}
            className={`flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-colors ${
              selected === m.id ? 'border-brand-primary bg-brand-light' : 'border-brand-border bg-white hover:border-brand-dark'
            }`}
          >
            <div className="flex items-center gap-3">
              <Truck size={20} className="text-brand-dark" />
              <div>
                <p className="font-medium text-brand-dark">{m.name} {m.zone && <span className="font-normal text-gray-500">— {m.zone}</span>}</p>
                {m.estimated_days && <p className="text-xs text-gray-500">Estimated delivery: {m.estimated_days}</p>}
              </div>
            </div>
            <span className="font-brand-display text-base font-semibold text-brand-dark">৳{Number(m.price).toLocaleString()}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-between border-t border-brand-border pt-4">
        <button onClick={() => navigate('/checkout/address')} className="rounded-md border border-brand-border px-6 py-3 text-sm font-semibold text-brand-dark hover:bg-brand-light">
          BACK
        </button>
        <button
          onClick={handleContinue}
          disabled={saving || !selected}
          className="rounded-md bg-brand-primary px-8 py-3 text-sm font-semibold text-white hover:bg-brand-primary-dark disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'CONTINUE TO REVIEW'}
        </button>
      </div>
    </div>
  )
}
