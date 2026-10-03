import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import * as orderService from '@/api/orderService'
import { useToast } from '@/context/ToastContext'
import { OrderListSkeleton } from '@/components/ui/Skeleton'

const ORDER_STATUS_TONE = {
  pending: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-50 text-blue-600',
  processing: 'bg-amber-50 text-brand-warning',
  packed: 'bg-amber-50 text-brand-warning',
  shipped: 'bg-blue-50 text-blue-600',
  delivered: 'bg-green-50 text-brand-success',
  cancelled: 'bg-red-50 text-brand-danger',
}

const PAYMENT_TONE = {
  pending: 'bg-gray-100 text-gray-600',
  paid: 'bg-green-50 text-brand-success',
  failed: 'bg-red-50 text-brand-danger',
  refunded: 'bg-gray-100 text-gray-600',
}

export default function AccountOrders() {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    orderService
      .getOrders({ per_page: 20 })
      .then((res) => active && setOrders(res.data || []))
      .catch((err) => active && toast.error(err.message || 'Could not load your orders.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="font-brand-display text-2xl font-semibold text-brand-dark">My Orders</h1>
        <OrderListSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="font-brand-display text-2xl font-semibold text-brand-dark">My Orders</h1>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-border bg-white px-6 py-16 text-center">
          <Package size={36} className="mx-auto text-brand-border" />
          <p className="mt-3 text-sm text-gray-500">No orders yet.</p>
          <Link to="/shop" className="mt-4 inline-block rounded-md bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-dark">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              to={`/account/orders/${o.id}`}
              className="flex flex-col gap-3 rounded-xl border border-brand-border bg-white p-4 transition-colors hover:border-brand-dark sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-mono text-sm font-semibold text-brand-dark">{o.order_number}</p>
                <p className="text-xs text-gray-500">{o.order_date ? new Date(o.order_date).toLocaleDateString() : ''} · {o.items?.length || 0} item(s)</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded px-2 py-1 text-xs font-medium capitalize ${PAYMENT_TONE[o.payment_status] || 'bg-gray-100 text-gray-600'}`}>{o.payment_status}</span>
                <span className={`rounded px-2 py-1 text-xs font-medium capitalize ${ORDER_STATUS_TONE[o.order_status] || 'bg-gray-100 text-gray-600'}`}>{o.order_status}</span>
              </div>
              <span className="font-brand-display text-base font-semibold text-brand-dark">৳{Number(o.total).toLocaleString()}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
