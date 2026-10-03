import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as orderService from '@/api/orderService'
import * as returnService from '@/api/returnService'
import * as variantService from '@/api/variantService'
import { useToast } from '@/context/ToastContext'
import { OrderDetailsSkeleton } from '@/components/ui/Skeleton'

const REASONS = [
  'Wrong size', 'Wrong color', 'Wrong product', 'Damaged product',
  'Defective product', 'Product not as expected', 'Changed mind', 'Other',
]

export default function CreateReturn() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [requestType, setRequestType] = useState('return') // return | exchange
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  // selected[itemId] = { checked, quantity, exchangeVariantId }
  const [selected, setSelected] = useState({})
  const [variantsByProduct, setVariantsByProduct] = useState({})
  const [loadingVariants, setLoadingVariants] = useState({})

  useEffect(() => {
    orderService
      .getOrder(orderId)
      .then(({ data }) => setOrder(data))
      .catch((err) => toast.error(err.message || 'Order not found.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const eligibleItems = useMemo(
    () => (order?.items || []).filter((item) => item.is_returnable !== false && (item.returnable_quantity ?? item.quantity) > 0),
    [order]
  )

  const toggleItem = (item) => {
    setSelected((prev) => {
      const current = prev[item.id]
      if (current?.checked) {
        const next = { ...prev }
        delete next[item.id]
        return next
      }
      return { ...prev, [item.id]: { checked: true, quantity: 1, exchangeVariantId: '' } }
    })

    if (requestType === 'exchange' && !variantsByProduct[item.product_id] && !loadingVariants[item.product_id]) {
      setLoadingVariants((p) => ({ ...p, [item.product_id]: true }))
      variantService
        .getVariants(item.product_id)
        .then(({ data }) => setVariantsByProduct((p) => ({ ...p, [item.product_id]: data || [] })))
        .catch(() => toast.error('Could not load available sizes/colors for exchange.'))
        .finally(() => setLoadingVariants((p) => ({ ...p, [item.product_id]: false })))
    }
  }

  const updateSelection = (itemId, patch) => {
    setSelected((prev) => ({ ...prev, [itemId]: { ...prev[itemId], ...patch } }))
  }

  const handleTypeChange = (type) => {
    setRequestType(type)
    // Fetch variants for any already-checked items when switching to exchange.
    if (type === 'exchange') {
      Object.entries(selected).forEach(([itemId, sel]) => {
        if (!sel.checked) return
        const item = eligibleItems.find((i) => String(i.id) === String(itemId))
        if (item && !variantsByProduct[item.product_id] && !loadingVariants[item.product_id]) {
          setLoadingVariants((p) => ({ ...p, [item.product_id]: true }))
          variantService
            .getVariants(item.product_id)
            .then(({ data }) => setVariantsByProduct((p) => ({ ...p, [item.product_id]: data || [] })))
            .finally(() => setLoadingVariants((p) => ({ ...p, [item.product_id]: false })))
        }
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const chosenItems = Object.entries(selected).filter(([, v]) => v.checked)

    if (chosenItems.length === 0) {
      toast.error('Select at least one item.')
      return
    }
    if (!reason) {
      toast.error('Please select a reason.')
      return
    }
    if (requestType === 'exchange' && chosenItems.some(([, v]) => !v.exchangeVariantId)) {
      toast.error('Please choose a replacement size/color for every selected item.')
      return
    }

    const items = chosenItems.map(([itemId, v]) => ({
      order_item_id: Number(itemId),
      quantity: Number(v.quantity) || 1,
      ...(requestType === 'exchange' ? { exchange_variant_id: Number(v.exchangeVariantId) } : {}),
    }))

    setSubmitting(true)
    try {
      const payload = { type: requestType, reason, description, items }
      const { data } =
        requestType === 'exchange'
          ? await returnService.createExchange(orderId, payload)
          : await returnService.createReturn(orderId, payload)

      toast.success('Your request has been submitted.')
      navigate(`/account/returns/${data.id}`)
    } catch (err) {
      toast.error(err.message || 'Could not submit your request.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <OrderDetailsSkeleton />
  if (!order) return null

  if (!order.can_return) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-brand-border bg-white p-8 text-center">
        <h1 className="font-brand-display text-xl font-semibold text-brand-dark">Not eligible</h1>
        <p className="text-sm text-gray-500">
          This order isn't eligible for a return, exchange, or refund right now — it may be outside the return window or not yet delivered.
        </p>
        <Link to={`/account/orders/${orderId}`} className="inline-block text-sm font-medium text-brand-primary hover:underline">← Back to order</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to={`/account/orders/${orderId}`} className="text-sm text-gray-500 hover:text-brand-primary">← Back to Order</Link>
        <h1 className="mt-1 font-brand-display text-2xl font-semibold text-brand-dark">Return or Exchange</h1>
        <p className="text-sm text-gray-500">Order {order.order_number}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-brand-border bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-brand-dark">What would you like to do?</h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange('return')}
              className={`flex-1 rounded-md border px-4 py-3 text-sm font-medium ${requestType === 'return' ? 'border-brand-primary bg-brand-light text-brand-primary' : 'border-brand-border text-gray-600'}`}
            >
              Return for Refund
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('exchange')}
              className={`flex-1 rounded-md border px-4 py-3 text-sm font-medium ${requestType === 'exchange' ? 'border-brand-primary bg-brand-light text-brand-primary' : 'border-brand-border text-gray-600'}`}
            >
              Exchange for Different Size/Color
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-brand-border bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-brand-dark">Select Items</h2>
          {eligibleItems.length === 0 ? (
            <p className="text-sm text-gray-500">No items from this order are eligible for return.</p>
          ) : (
            <div className="divide-y divide-brand-border">
              {eligibleItems.map((item) => {
                const sel = selected[item.id]
                const maxQty = item.returnable_quantity ?? item.quantity
                const variants = (variantsByProduct[item.product_id] || []).filter((v) => v.id !== item.variant_id && v.status)
                return (
                  <div key={item.id} className="space-y-2 py-4">
                    <label className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1" checked={!!sel?.checked} onChange={() => toggleItem(item)} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-brand-dark">{item.product_name}</p>
                        <p className="text-xs text-gray-500">
                          {item.color ? `${item.color} · ` : ''}{item.size ? `${item.size} · ` : ''}Ordered {item.quantity} · ৳{Number(item.unit_price).toLocaleString()} each
                        </p>
                        <p className="text-xs text-gray-400">Eligible to return: {maxQty}</p>
                      </div>
                    </label>

                    {sel?.checked && (
                      <div className="ml-7 flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                          Quantity
                          <input
                            type="number"
                            min={1}
                            max={maxQty}
                            value={sel.quantity}
                            onChange={(e) => updateSelection(item.id, { quantity: Math.min(maxQty, Math.max(1, Number(e.target.value) || 1)) })}
                            className="w-16 rounded-md border border-brand-border px-2 py-1 text-sm"
                          />
                        </label>

                        {requestType === 'exchange' && (
                          <label className="flex items-center gap-2 text-xs text-gray-600">
                            Replace with
                            <select
                              value={sel.exchangeVariantId}
                              onChange={(e) => updateSelection(item.id, { exchangeVariantId: e.target.value })}
                              className="rounded-md border border-brand-border px-2 py-1 text-sm"
                            >
                              <option value="">
                                {loadingVariants[item.product_id] ? 'Loading…' : 'Select size/color'}
                              </option>
                              {variants.map((v) => (
                                <option key={v.id} value={v.id} disabled={v.stock < 1}>
                                  {[v.color, v.size].filter(Boolean).join(' / ')} {v.stock < 1 ? '(out of stock)' : ''}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-brand-border bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-brand-dark">Reason</h2>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-md border border-brand-border px-3 py-2 text-sm">
            <option value="">Select a reason</option>
            {REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us more (optional)"
            rows={3}
            className="mt-3 w-full rounded-md border border-brand-border px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-brand-primary py-3 text-sm font-semibold text-white hover:bg-brand-primary-dark disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </div>
  )
}
