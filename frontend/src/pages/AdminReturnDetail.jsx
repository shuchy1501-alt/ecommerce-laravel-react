import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import * as returnsApi from '@/api/returns'
import { useToast } from '@/context/ToastContext'

function formatCurrency(value) {
  return `৳${Number(value || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
}

function statusTone(status) {
  if (['completed', 'refunded', 'exchange_completed'].includes(status)) return 'success'
  if (['rejected', 'cancelled'].includes(status)) return 'danger'
  if (status === 'requested') return 'neutral'
  return 'accent'
}

const CONDITIONS = ['new', 'opened', 'damaged', 'defective', 'wrong_item']

export default function AdminReturnDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [ret, setRet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [conditions, setConditions] = useState({}) // itemId -> condition

  const load = () => {
    setLoading(true)
    returnsApi
      .fetchReturn(id)
      .then((res) => setRet(res.data))
      .catch((err) => toast.error(err.message || 'Could not load this return.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (fn, successMsg) => {
    setBusy(true)
    try {
      await fn()
      toast.success(successMsg)
      load()
    } catch (err) {
      toast.error(err.message || 'That action could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  const handleApprove = () => run(() => returnsApi.approveReturn(id), 'Return approved.')
  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('A rejection reason is required.')
      return
    }
    run(() => returnsApi.rejectReturn(id, rejectReason), 'Return rejected.').then(() => setShowReject(false))
  }
  const handleReceive = () => run(() => returnsApi.receiveReturn(id), 'Marked as received.')
  const handleInspect = () => {
    const inspections = (ret.items || []).map((item) => ({
      return_item_id: item.id,
      condition: conditions[item.id] || 'new',
    }))
    run(() => returnsApi.inspectReturn(id, inspections), 'Items inspected — refund/exchange created.')
  }
  const handleProcessRefund = (refundId) => run(() => returnsApi.processRefund(refundId), 'Refund processed.')

  if (loading) {
    return <div className="rounded-sm border border-stone-light bg-white p-10 text-center text-sm text-stone">Loading…</div>
  }
  if (!ret) return null

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/returns" className="text-xs text-stone hover:underline">← Back to Returns</Link>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="font-display text-2xl text-ink">{ret.return_number}</h1>
            <span className="rounded-sm bg-bone-dim px-2 py-1 text-xs capitalize text-stone">{ret.type}</span>
          </div>
          <p className="text-xs text-stone">
            Order <Link to={`/admin/orders/${ret.order_id}`} className="underline">{ret.order_number}</Link> · {ret.customer?.name} ({ret.customer?.email})
          </p>
        </div>
        <Badge tone={statusTone(ret.status)}>{ret.status?.replace(/_/g, ' ')}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-sm border border-stone-light bg-white p-5">
            <h2 className="mb-3 text-sm font-medium text-ink">Actions</h2>
            <div className="flex flex-wrap items-center gap-2">
              {ret.status === 'requested' && (
                <>
                  <Button size="sm" onClick={handleApprove} loading={busy}>Approve</Button>
                  {!showReject ? (
                    <Button size="sm" variant="danger" onClick={() => setShowReject(true)}>Reject</Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Rejection reason"
                        className="rounded-sm border border-stone-light px-3 py-1.5 text-xs"
                      />
                      <Button size="sm" variant="danger" onClick={handleReject} loading={busy}>Confirm Reject</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowReject(false)}>Cancel</Button>
                    </div>
                  )}
                </>
              )}

              {['approved', 'pickup_scheduled', 'in_transit'].includes(ret.status) && (
                <Button size="sm" onClick={handleReceive} loading={busy}>Mark Received</Button>
              )}

              {ret.status === 'received' && (
                <Button size="sm" onClick={handleInspect} loading={busy}>Submit Inspection</Button>
              )}

              {['requested', 'approved', 'received'].indexOf(ret.status) === -1 && !['rejected', 'cancelled', 'completed'].includes(ret.status) && (
                <span className="text-xs text-stone">Awaiting downstream processing (refund/exchange).</span>
              )}
            </div>
          </div>

          <div className="rounded-sm border border-stone-light bg-white">
            <div className="border-b border-stone-light p-4">
              <h2 className="text-sm font-medium text-ink">Items</h2>
            </div>
            <div className="divide-y divide-stone-light">
              {ret.items?.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-ink">{item.product_name}</p>
                    <p className="text-xs text-stone">
                      {[item.color, item.size].filter(Boolean).join(' / ')} · Qty {item.quantity} · Reason: {item.reason}
                    </p>
                    {item.exchange_variant && (
                      <p className="text-xs text-oxblood">Replacement: {[item.exchange_variant.color, item.exchange_variant.size].filter(Boolean).join(' / ')}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {ret.type !== 'exchange' && <span className="font-medium text-ink">{formatCurrency(item.refund_amount)}</span>}
                    {ret.status === 'received' ? (
                      <select
                        value={conditions[item.id] || item.condition || 'new'}
                        onChange={(e) => setConditions((c) => ({ ...c, [item.id]: e.target.value }))}
                        className="rounded-sm border border-stone-light px-2 py-1 text-xs capitalize"
                      >
                        {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : item.condition ? (
                      <span className="rounded-sm bg-bone-dim px-2 py-1 text-xs capitalize text-stone">{item.condition}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {ret.status_history?.length > 0 && (
            <div className="rounded-sm border border-stone-light bg-white p-5">
              <h2 className="mb-3 text-sm font-medium text-ink">Status History</h2>
              <div className="space-y-2 text-xs text-stone">
                {ret.status_history.map((h, i) => (
                  <div key={i} className="flex flex-wrap justify-between gap-2 border-b border-stone-light/60 pb-2 last:border-0">
                    <span className="capitalize text-ink">{(h.from_status || 'created').replace(/_/g, ' ')} → {h.to_status.replace(/_/g, ' ')}</span>
                    <span>{h.note}</span>
                    <span>{h.created_at ? new Date(h.created_at).toLocaleString() : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-sm border border-stone-light bg-white p-5 text-sm">
            <h2 className="mb-3 font-medium text-ink">Reason</h2>
            <p className="text-stone">{ret.reason}</p>
            {ret.description && <p className="mt-2 text-xs text-stone">{ret.description}</p>}
          </div>

          {ret.refunds?.length > 0 && (
            <div className="rounded-sm border border-stone-light bg-white p-5 text-sm">
              <h2 className="mb-3 font-medium text-ink">Refund</h2>
              {ret.refunds.map((refund) => (
                <div key={refund.id} className="mb-3 space-y-1 border-b border-stone-light/60 pb-3 last:mb-0 last:border-0 last:pb-0">
                  <div className="flex justify-between"><span className="text-stone">Number</span><span className="font-mono text-xs text-ink">{refund.refund_number}</span></div>
                  <div className="flex justify-between"><span className="text-stone">Amount</span><span className="font-medium text-ink">{formatCurrency(refund.amount)}</span></div>
                  <div className="flex justify-between"><span className="text-stone">Method</span><span className="uppercase text-ink">{refund.refund_method}</span></div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone">Status</span>
                    <Badge tone={refund.status === 'completed' ? 'success' : refund.status === 'failed' ? 'danger' : 'neutral'}>{refund.status}</Badge>
                  </div>
                  {refund.status === 'pending' && (
                    <Button size="sm" className="mt-2 w-full" onClick={() => handleProcessRefund(refund.id)} loading={busy}>
                      Process Refund
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {ret.exchange && (
            <div className="rounded-sm border border-stone-light bg-white p-5 text-sm">
              <h2 className="mb-3 font-medium text-ink">Exchange</h2>
              <div className="flex justify-between"><span className="text-stone">Status</span><Badge tone={statusTone(ret.exchange.status)}>{ret.exchange.status}</Badge></div>
              {ret.exchange.price_difference > 0 && (
                <div className="mt-2 flex justify-between"><span className="text-stone">Price Diff.</span><span className="text-ink">{formatCurrency(ret.exchange.price_difference)} ({ret.exchange.price_difference_action?.replace(/_/g, ' ')})</span></div>
              )}
              <Link to="/admin/exchanges" className="mt-3 block text-xs font-medium text-oxblood hover:underline">Manage exchange fulfillment →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
