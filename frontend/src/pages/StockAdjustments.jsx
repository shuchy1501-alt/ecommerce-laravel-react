import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useToast } from '@/context/ToastContext'
import { adjustStock, getMovements, getStockDetail } from '@/api/inventoryService'
import ProductVariantSearch from '@/components/inventory/ProductVariantSearch'

const REASONS = [
  'Damaged products',
  'Lost products',
  'Found products',
  'Counting error',
  'Manual correction',
  'Other',
]

export default function StockAdjustments() {
  const [params] = useSearchParams()
  const toast = useToast?.()
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [direction, setDirection] = useState('increase')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState(REASONS[0])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [log, setLog] = useState([])
  const [logLoading, setLogLoading] = useState(true)

  const loadLog = () => {
    setLogLoading(true)
    getMovements({ type: 'adjustment_in', per_page: 10 })
      .then((res1) =>
        getMovements({ type: 'adjustment_out', per_page: 10 }).then((res2) => {
          const merged = [...(res1.data || []), ...(res2.data || [])].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          )
          setLog(merged.slice(0, 15))
        })
      )
      .catch((err) => toast?.error?.(err.message || 'Failed to load adjustment history.'))
      .finally(() => setLogLoading(false))
  }

  useEffect(loadLog, [])

  useEffect(() => {
    const variantId = params.get('variant_id')
    if (!variantId) return
    getStockDetail(variantId)
      .then((res) => {
        const item = res.data.item
        setSelectedVariant({
          id: item.variant_id,
          sku: item.sku,
          product_name: item.product_name,
          attributes: [item.size, item.color].filter(Boolean).join(' / '),
          stock: item.stock,
        })
      })
      .catch(() => {})
  }, [params])

  const currentStock = selectedVariant?.stock ?? 0
  const newStock = direction === 'increase' ? currentStock + Number(quantity || 0) : currentStock - Number(quantity || 0)

  const submit = async (e) => {
    e.preventDefault()
    if (!selectedVariant) {
      toast?.error?.('Please select a product variant.')
      return
    }
    if (direction === 'decrease' && Number(quantity) > currentStock) {
      toast?.error?.(`Cannot decrease below zero. Only ${currentStock} unit(s) available.`)
      return
    }
    setSaving(true)
    try {
      await adjustStock({
        variant_id: selectedVariant.id,
        type: direction,
        quantity: Number(quantity),
        reason,
        notes,
      })
      toast?.success?.('Stock adjustment recorded successfully')
      setSelectedVariant((v) => (v ? { ...v, stock: newStock } : v))
      setQuantity(1)
      setNotes('')
      loadLog()
    } catch (err) {
      toast?.error?.(err.message || 'Failed to record adjustment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-ink">Stock Adjustments</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={submit} className="rounded-sm border border-stone-light bg-white p-5 lg:col-span-1">
          <h2 className="mb-4 font-display text-base text-ink">New Adjustment</h2>

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">Product</label>
            {selectedVariant ? (
              <div className="flex items-center justify-between rounded-sm border border-stone-light bg-bone-dim/60 px-3 py-2 text-sm">
                <div>
                  <p className="text-ink">{selectedVariant.product_name}</p>
                  <p className="text-xs text-stone">{selectedVariant.sku} {selectedVariant.attributes && `· ${selectedVariant.attributes}`}</p>
                </div>
                <button type="button" onClick={() => setSelectedVariant(null)} className="text-xs text-oxblood hover:underline">
                  Change
                </button>
              </div>
            ) : (
              <ProductVariantSearch onSelect={(product, variant) => setSelectedVariant({
                id: variant.id, sku: variant.sku, product_name: product.name,
                attributes: [variant.size, variant.color].filter(Boolean).join(' / '), stock: variant.stock,
              })} />
            )}
          </div>

          {selectedVariant && (
            <p className="mb-4 text-sm text-stone">
              Current Stock: <span className="font-medium text-ink">{currentStock}</span>
            </p>
          )}

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">Adjustment Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDirection('increase')}
                className={`flex-1 rounded-sm border px-3 py-2 text-sm ${direction === 'increase' ? 'border-success bg-success/10 text-success' : 'border-stone-light text-stone'}`}
              >
                Increase
              </button>
              <button
                type="button"
                onClick={() => setDirection('decrease')}
                className={`flex-1 rounded-sm border px-3 py-2 text-sm ${direction === 'decrease' ? 'border-danger bg-danger/10 text-danger' : 'border-stone-light text-stone'}`}
              >
                Decrease
              </button>
            </div>
          </div>

          <Input label="Quantity" type="number" min="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mb-4" />

          {selectedVariant && (
            <p className="mb-4 text-sm text-stone">
              New Stock Preview: <span className={`font-medium ${newStock < 0 ? 'text-danger' : 'text-ink'}`}>{newStock}</span>
            </p>
          )}

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
            />
          </div>

          <Button type="submit" loading={saving} className="w-full">
            Record Adjustment
          </Button>
        </form>

        <div className="rounded-sm border border-stone-light bg-white lg:col-span-2">
          <div className="border-b border-stone-light px-4 py-3">
            <h2 className="font-display text-base text-ink">Recent Adjustments</h2>
          </div>
          {logLoading && <div className="h-40 animate-pulse bg-bone-dim" />}
          {!logLoading && (
            <ul className="divide-y divide-stone-light">
              {log.length === 0 && <li className="px-4 py-6 text-center text-sm text-stone">No adjustments recorded yet.</li>}
              {log.map((m) => (
                <li key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="text-ink">{m.product_name}</p>
                    <p className="text-xs text-stone">{m.sku} · {new Date(m.created_at).toLocaleString()}</p>
                    {m.note && <p className="text-xs text-stone">{m.note}</p>}
                  </div>
                  <p className={m.quantity >= 0 ? 'text-success' : 'text-danger'}>
                    {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
