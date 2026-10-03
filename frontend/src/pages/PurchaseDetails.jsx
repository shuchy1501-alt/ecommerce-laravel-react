import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { getPurchase, receivePurchase, cancelPurchase } from '@/api/purchaseService'

const money = (v) => `৳${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
const STATUS_TONE = { draft: 'neutral', ordered: 'warning', partially_received: 'warning', received: 'success', cancelled: 'danger' }

export default function PurchaseDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast?.()
  const { can } = useAuth()
  const [purchase, setPurchase] = useState(null)
  const [loading, setLoading] = useState(true)
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [receiveQty, setReceiveQty] = useState({})
  const [busy, setBusy] = useState(false)

  const load = () => {
    setLoading(true)
    getPurchase(id)
      .then((res) => setPurchase(res.data))
      .catch((err) => toast?.error?.(err.message || 'Failed to load purchase.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const openReceive = () => {
    const defaults = {}
    purchase.items.forEach((it) => {
      const outstanding = it.quantity - it.received_quantity
      if (outstanding > 0) defaults[it.id] = outstanding
    })
    setReceiveQty(defaults)
    setReceiveOpen(true)
  }

  const submitReceive = async () => {
    setBusy(true)
    try {
      const items = Object.entries(receiveQty)
        .filter(([, qty]) => Number(qty) > 0)
        .map(([item_id, qty]) => ({ item_id: Number(item_id), quantity: Number(qty) }))

      const res = await receivePurchase(id, items.length ? items : undefined)
      toast?.success?.(res.message || 'Purchase received successfully')
      setPurchase(res.data)
      setReceiveOpen(false)
    } catch (err) {
      toast?.error?.(err.message || 'Failed to receive purchase.')
    } finally {
      setBusy(false)
    }
  }

  const doCancel = async () => {
    if (!window.confirm('Cancel this purchase? This cannot be undone.')) return
    setBusy(true)
    try {
      const res = await cancelPurchase(id)
      toast?.success?.('Purchase cancelled successfully')
      setPurchase(res.data)
    } catch (err) {
      toast?.error?.(err.message || 'Failed to cancel purchase.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="h-64 animate-pulse rounded-sm bg-bone-dim" />
  if (!purchase) return null

  const canReceive = ['draft', 'ordered', 'partially_received'].includes(purchase.status)
  const canCancel = ['draft', 'ordered'].includes(purchase.status)

  return (
    <div>
      <Link to="/admin/purchases" className="mb-4 inline-block text-xs font-medium text-oxblood hover:underline">
        ← Back to Purchases
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink">{purchase.purchase_number}</h1>
          <p className="text-sm text-stone">
            <Link to={`/admin/suppliers/${purchase.supplier_id}`} className="hover:underline">{purchase.supplier?.name}</Link> · {purchase.purchase_date}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={STATUS_TONE[purchase.status]}>{purchase.status.replace('_', ' ')}</Badge>
          {can('purchases.receive') && canReceive && (
            <Button size="sm" onClick={openReceive} disabled={busy}>Receive</Button>
          )}
          {can('purchases.cancel') && canCancel && (
            <Button size="sm" variant="danger" onClick={doCancel} disabled={busy}>Cancel</Button>
          )}
        </div>
      </div>

      <div className="mb-6 overflow-x-auto rounded-sm border border-stone-light bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-stone-light bg-bone-dim/60 text-[11px] uppercase tracking-wider text-stone">
              <th className="px-4 py-3 font-utility">Product</th>
              <th className="px-4 py-3 font-utility">SKU</th>
              <th className="px-4 py-3 font-utility text-right">Ordered</th>
              <th className="px-4 py-3 font-utility text-right">Received</th>
              <th className="px-4 py-3 font-utility text-right">Unit Cost</th>
              <th className="px-4 py-3 font-utility text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {purchase.items.map((it) => (
              <tr key={it.id} className="border-b border-stone-light last:border-0">
                <td className="px-4 py-3 text-ink">{it.product_name} {it.size || it.color ? <span className="text-xs text-stone">({[it.size, it.color].filter(Boolean).join(' / ')})</span> : null}</td>
                <td className="px-4 py-3 font-mono text-xs text-stone">{it.sku}</td>
                <td className="px-4 py-3 text-right text-stone">{it.quantity}</td>
                <td className="px-4 py-3 text-right text-stone">{it.received_quantity}</td>
                <td className="px-4 py-3 text-right text-stone">{money(it.unit_cost)}</td>
                <td className="px-4 py-3 text-right text-ink">{money(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-sm border border-stone-light bg-white p-5 lg:col-span-2">
          <h2 className="mb-3 font-display text-base text-ink">Notes</h2>
          <p className="text-sm text-stone">{purchase.notes || '—'}</p>
          <p className="mt-4 text-xs text-stone">Created by {purchase.created_by || 'System'}</p>
        </div>
        <div className="rounded-sm border border-stone-light bg-white p-5">
          <h2 className="mb-3 font-display text-base text-ink">Summary</h2>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd className="text-ink">{money(purchase.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-stone">Discount</dt><dd className="text-ink">-{money(purchase.discount)}</dd></div>
            <div className="flex justify-between"><dt className="text-stone">Shipping</dt><dd className="text-ink">+{money(purchase.shipping_cost)}</dd></div>
            <div className="flex justify-between"><dt className="text-stone">Tax</dt><dd className="text-ink">+{money(purchase.tax)}</dd></div>
            <div className="flex justify-between border-t border-stone-light pt-1.5 font-medium"><dt className="text-ink">Total</dt><dd className="text-ink">{money(purchase.total)}</dd></div>
          </dl>
        </div>
      </div>

      <Modal open={receiveOpen} onClose={() => setReceiveOpen(false)} title="Receive Purchase">
        <p className="mb-4 text-sm text-stone">Confirm the quantity received for each item. Stock will increase accordingly.</p>
        <div className="space-y-3">
          {purchase.items
            .filter((it) => it.quantity - it.received_quantity > 0)
            .map((it) => {
              const outstanding = it.quantity - it.received_quantity
              return (
                <div key={it.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-ink">{it.product_name}</p>
                    <p className="text-xs text-stone">{it.sku} · outstanding {outstanding}</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={outstanding}
                    value={receiveQty[it.id] ?? 0}
                    onChange={(e) => setReceiveQty((q) => ({ ...q, [it.id]: Math.min(Number(e.target.value), outstanding) }))}
                    className="w-24 rounded-sm border border-stone-light px-2 py-1 text-sm outline-none focus:border-oxblood"
                  />
                </div>
              )
            })}
          {purchase.items.every((it) => it.quantity - it.received_quantity <= 0) && (
            <p className="text-sm text-stone">All items have already been received.</p>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setReceiveOpen(false)}>Cancel</Button>
          <Button loading={busy} onClick={submitReceive}>Confirm Receive</Button>
        </div>
      </Modal>
    </div>
  )
}
