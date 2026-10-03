import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import * as returnService from '@/api/returnService'
import { useToast } from '@/context/ToastContext'
import { OrderListSkeleton } from '@/components/ui/Skeleton'

const STATUS_TONE = {
  requested: 'bg-gray-100 text-gray-600',
  approved: 'bg-blue-50 text-blue-600',
  pickup_scheduled: 'bg-blue-50 text-blue-600',
  in_transit: 'bg-blue-50 text-blue-600',
  received: 'bg-amber-50 text-brand-warning',
  inspected: 'bg-amber-50 text-brand-warning',
  refund_pending: 'bg-amber-50 text-brand-warning',
  refunded: 'bg-green-50 text-brand-success',
  exchange_processing: 'bg-amber-50 text-brand-warning',
  exchange_completed: 'bg-green-50 text-brand-success',
  completed: 'bg-green-50 text-brand-success',
  rejected: 'bg-red-50 text-brand-danger',
  cancelled: 'bg-gray-100 text-gray-600',
}

const TYPE_LABEL = { return: 'Return', exchange: 'Exchange', refund: 'Refund' }

export default function AccountReturns() {
  const toast = useToast()
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    returnService
      .getReturns({ per_page: 20 })
      .then((res) => active && setReturns(res.data || []))
      .catch((err) => active && toast.error(err.message || 'Could not load your returns.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="font-brand-display text-2xl font-semibold text-brand-dark">My Returns</h1>
        <OrderListSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="font-brand-display text-2xl font-semibold text-brand-dark">My Returns</h1>

      {returns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-border bg-white px-6 py-16 text-center">
          <RotateCcw size={36} className="mx-auto text-brand-border" />
          <p className="mt-3 text-sm text-gray-500">You haven't requested a return, exchange, or refund yet.</p>
          <Link to="/account/orders" className="mt-4 inline-block rounded-md bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-dark">
            View My Orders
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => (
            <Link
              key={r.id}
              to={`/account/returns/${r.id}`}
              className="flex flex-col gap-3 rounded-xl border border-brand-border bg-white p-4 transition-colors hover:border-brand-dark sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-mono text-sm font-semibold text-brand-dark">{r.return_number}</p>
                <p className="text-xs text-gray-500">
                  Order {r.order_number} · {r.requested_at ? new Date(r.requested_at).toLocaleDateString() : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-brand-light px-2 py-1 text-xs font-medium text-brand-dark">{TYPE_LABEL[r.type] || r.type}</span>
                <span className={`rounded px-2 py-1 text-xs font-medium capitalize ${STATUS_TONE[r.status] || 'bg-gray-100 text-gray-600'}`}>
                  {r.status?.replace(/_/g, ' ')}
                </span>
              </div>
              {r.type !== 'exchange' && r.refund_amount > 0 && (
                <span className="font-brand-display text-base font-semibold text-brand-dark">৳{Number(r.refund_amount).toLocaleString()}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
