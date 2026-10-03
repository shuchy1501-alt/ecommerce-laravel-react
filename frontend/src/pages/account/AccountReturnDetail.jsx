import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as returnService from '@/api/returnService'
import { useToast } from '@/context/ToastContext'
import ReturnTimeline from '@/components/store/ReturnTimeline'
import { OrderDetailsSkeleton } from '@/components/ui/Skeleton'

const TYPE_LABEL = { return: 'Return', exchange: 'Exchange', refund: 'Refund' }

export default function AccountReturnDetail() {
  const { id } = useParams()
  const toast = useToast()

  const [ret, setRet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const load = () => {
    setLoading(true)
    returnService
      .getReturn(id)
      .then(({ data }) => setRet(data))
      .catch((err) => toast.error(err.message || 'Return request not found.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await returnService.cancelReturn(id)
      toast.success('Request cancelled.')
      setConfirmCancel(false)
      load()
    } catch (err) {
      toast.error(err.message || 'This request can no longer be cancelled.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <OrderDetailsSkeleton />
  if (!ret) return null

  const refund = ret.refunds?.[0]

  return (
    <div className="space-y-6">
      <div>
        <Link to="/account/returns" className="text-sm text-gray-500 hover:text-brand-primary">← Back to Returns</Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="font-mono text-xl font-semibold text-brand-dark">{ret.return_number}</h1>
          <span className="rounded bg-brand-light px-2 py-1 text-xs font-medium text-brand-dark">{TYPE_LABEL[ret.type] || ret.type}</span>
        </div>
        <p className="text-xs text-gray-500">
          Order <Link to={`/account/orders/${ret.order_id}`} className="underline">{ret.order_number}</Link> · Requested {ret.requested_at ? new Date(ret.requested_at).toLocaleString() : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-brand-border bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-brand-dark">Status</h2>
            <ReturnTimeline status={ret.status} type={ret.type} />
          </div>

          <div className="divide-y divide-brand-border rounded-xl border border-brand-border bg-white">
            {ret.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-medium text-brand-dark">{item.product_name}</p>
                  <p className="text-xs text-gray-500">
                    {item.color ? `${item.color} · ` : ''}{item.size ? `${item.size} · ` : ''}Qty {item.quantity} · Reason: {item.reason}
                  </p>
                  {item.condition && <p className="text-xs text-gray-500">Condition on inspection: <span className="capitalize">{item.condition}</span></p>}
                  {item.exchange_variant && (
                    <p className="mt-1 text-xs text-brand-primary">
                      Exchanging for: {[item.exchange_variant.color, item.exchange_variant.size].filter(Boolean).join(' / ')}
                    </p>
                  )}
                </div>
                {item.refund_amount != null && ret.type !== 'exchange' && (
                  <span className="font-brand-display text-sm font-semibold text-brand-dark">৳{Number(item.refund_amount).toLocaleString()}</span>
                )}
              </div>
            ))}
          </div>

          {ret.description && (
            <div className="rounded-xl border border-brand-border bg-white p-5 text-sm">
              <h2 className="mb-2 font-semibold text-brand-dark">Your Note</h2>
              <p className="text-gray-600">{ret.description}</p>
            </div>
          )}

          {ret.admin_note && (
            <div className="rounded-xl border border-brand-border bg-white p-5 text-sm">
              <h2 className="mb-2 font-semibold text-brand-dark">Note from FashionMart</h2>
              <p className="text-gray-600">{ret.admin_note}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-brand-border bg-white p-5 text-sm">
            <h2 className="mb-3 font-semibold text-brand-dark">Reason</h2>
            <p className="text-gray-600">{ret.reason}</p>
          </div>

          {ret.type !== 'exchange' && (
            <div className="rounded-xl border border-brand-border bg-white p-5 text-sm">
              <h2 className="mb-3 font-semibold text-brand-dark">Refund</h2>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-medium text-brand-dark">৳{Number(ret.refund_amount || 0).toLocaleString()}</span></div>
              {refund && (
                <>
                  <div className="mt-1 flex justify-between"><span className="text-gray-500">Method</span><span className="uppercase text-brand-dark">{refund.refund_method}</span></div>
                  <div className="mt-1 flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium capitalize text-brand-dark">{refund.status}</span></div>
                </>
              )}
            </div>
          )}

          {ret.exchange && (
            <div className="rounded-xl border border-brand-border bg-white p-5 text-sm">
              <h2 className="mb-3 font-semibold text-brand-dark">Exchange</h2>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium capitalize text-brand-dark">{ret.exchange.status?.replace(/_/g, ' ')}</span></div>
              {ret.exchange.price_difference > 0 && (
                <div className="mt-1 flex justify-between">
                  <span className="text-gray-500">Price Difference</span>
                  <span className="font-medium text-brand-dark">
                    ৳{Number(ret.exchange.price_difference).toLocaleString()} ({ret.exchange.price_difference_action?.replace(/_/g, ' ')})
                  </span>
                </div>
              )}
            </div>
          )}

          {ret.status === 'requested' && (
            <div className="rounded-xl border border-brand-border bg-white p-5">
              {confirmCancel ? (
                <div className="space-y-2 text-center">
                  <p className="text-xs text-gray-500">Cancel this request?</p>
                  <div className="flex gap-2">
                    <button onClick={handleCancel} disabled={cancelling} className="flex-1 rounded-md bg-brand-danger py-2 text-xs font-semibold text-white disabled:opacity-60">
                      {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
                    </button>
                    <button onClick={() => setConfirmCancel(false)} className="flex-1 rounded-md border border-brand-border py-2 text-xs font-semibold text-brand-dark">No</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmCancel(true)} className="w-full text-sm font-medium text-brand-danger hover:underline">
                  Cancel this request
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
