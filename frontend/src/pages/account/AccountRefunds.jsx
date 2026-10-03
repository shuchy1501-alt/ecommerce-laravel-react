import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet } from 'lucide-react'
import * as returnService from '@/api/returnService'
import { useToast } from '@/context/ToastContext'
import { OrderListSkeleton } from '@/components/ui/Skeleton'

const STATUS_TONE = {
  pending: 'bg-gray-100 text-gray-600',
  processing: 'bg-amber-50 text-brand-warning',
  completed: 'bg-green-50 text-brand-success',
  failed: 'bg-red-50 text-brand-danger',
  cancelled: 'bg-gray-100 text-gray-600',
}

export default function AccountRefunds() {
  const toast = useToast()
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    returnService
      .getRefunds({ per_page: 20 })
      .then((res) => active && setRefunds(res.data || []))
      .catch((err) => active && toast.error(err.message || 'Could not load your refunds.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="font-brand-display text-2xl font-semibold text-brand-dark">My Refunds</h1>
        <OrderListSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="font-brand-display text-2xl font-semibold text-brand-dark">My Refunds</h1>

      {refunds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-border bg-white px-6 py-16 text-center">
          <Wallet size={36} className="mx-auto text-brand-border" />
          <p className="mt-3 text-sm text-gray-500">No refunds yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {refunds.map((r) => (
            <div key={r.id} className="flex flex-col gap-3 rounded-xl border border-brand-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-sm font-semibold text-brand-dark">{r.refund_number}</p>
                <p className="text-xs text-gray-500">
                  Order {r.order_number} · {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''} · <span className="uppercase">{r.refund_method}</span>
                </p>
                {r.return_id && (
                  <Link to={`/account/returns/${r.return_id}`} className="text-xs text-brand-primary hover:underline">View return request</Link>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded px-2 py-1 text-xs font-medium capitalize ${STATUS_TONE[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
                <span className="font-brand-display text-base font-semibold text-brand-dark">৳{Number(r.amount).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
