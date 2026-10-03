import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FileText } from 'lucide-react'
import * as orderService from '@/api/orderService'
import { useToast } from '@/context/ToastContext'
import OrderTimeline from '@/components/store/OrderTimeline'
import { OrderDetailsSkeleton } from '@/components/ui/Skeleton'

const PAYMENT_LABEL = { pending: 'Pending', paid: 'Paid', failed: 'Failed', refunded: 'Refunded' }

export default function AccountOrderDetail() {
  const { id } = useParams()
  const toast = useToast()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const load = () => {
    setLoading(true)
    orderService
      .getOrder(id)
      .then(({ data }) => setOrder(data))
      .catch((err) => toast.error(err.message || 'Order not found.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await orderService.cancelOrder(id)
      toast.success('Order cancelled successfully.')
      setConfirmCancel(false)
      load()
    } catch (err) {
      toast.error(err.message || 'This order can no longer be cancelled.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <OrderDetailsSkeleton />
  if (!order) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/account/orders" className="text-sm text-gray-500 hover:text-brand-primary">← Back to Orders</Link>
          <h1 className="mt-1 font-mono text-xl font-semibold text-brand-dark">{order.order_number}</h1>
          <p className="text-xs text-gray-500">Placed {order.placed_at ? new Date(order.placed_at).toLocaleString() : ''}</p>
        </div>
        <Link
          to={`/account/orders/${order.id}/invoice`}
          className="flex items-center gap-1.5 rounded-md border border-brand-border px-4 py-2 text-sm font-medium text-brand-dark hover:bg-brand-light"
        >
          <FileText size={15} /> View Invoice
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-brand-border bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-brand-dark">Order Timeline</h2>
            <OrderTimeline status={order.order_status} />
          </div>

          <div className="divide-y divide-brand-border rounded-xl border border-brand-border bg-white">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-medium text-brand-dark">{item.product_name}</p>
                  <p className="text-xs text-gray-500">
                    {item.color ? `${item.color} · ` : ''}{item.size ? `${item.size} · ` : ''}Qty {item.quantity} × ৳{Number(item.unit_price).toLocaleString()}
                  </p>
                </div>
                <span className="font-brand-display text-sm font-semibold text-brand-dark">৳{Number(item.subtotal).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-brand-border bg-white p-5 text-sm">
            <h2 className="mb-3 font-semibold text-brand-dark">Shipping Address</h2>
            <p className="font-medium text-brand-dark">{order.shipping?.name}</p>
            <p className="text-gray-500">{order.shipping?.phone}</p>
            <p className="mt-1 text-gray-600">{order.shipping?.address}</p>
            <p className="text-gray-600">{[order.shipping?.district, order.shipping?.division].filter(Boolean).join(', ')}</p>
          </div>

          <div className="rounded-xl border border-brand-border bg-white p-5 text-sm">
            <h2 className="mb-3 font-semibold text-brand-dark">Payment</h2>
            <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="uppercase text-brand-dark">{order.payment_method}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium text-brand-dark">{PAYMENT_LABEL[order.payment_status] || order.payment_status}</span></div>
          </div>

          <div className="rounded-xl border border-brand-border bg-white p-5 text-sm">
            <h2 className="mb-3 font-semibold text-brand-dark">Order Summary</h2>
            <div className="space-y-1.5">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="text-brand-dark">৳{Number(order.subtotal).toLocaleString()}</span></div>
              {order.coupon_discount > 0 && (
                <div className="flex justify-between text-brand-success"><span>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span><span>-৳{Number(order.coupon_discount).toLocaleString()}</span></div>
              )}
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="text-brand-dark">৳{Number(order.shipping_charge).toLocaleString()}</span></div>
              <div className="flex justify-between border-t border-brand-border pt-1.5 text-base font-semibold text-brand-dark"><span>Total</span><span>৳{Number(order.total).toLocaleString()}</span></div>
            </div>
          </div>

          {order.can_return && (
            <div className="rounded-xl border border-brand-border bg-white p-5">
              <Link
                to={`/account/orders/${order.id}/return`}
                className="block w-full rounded-md border border-brand-primary py-2.5 text-center text-sm font-semibold text-brand-primary hover:bg-brand-light"
              >
                Return / Exchange Items
              </Link>
            </div>
          )}

          {order.can_cancel && (
            <div className="rounded-xl border border-brand-border bg-white p-5">
              {confirmCancel ? (
                <div className="space-y-2 text-center">
                  <p className="text-xs text-gray-500">Are you sure you want to cancel this order?</p>
                  <div className="flex gap-2">
                    <button onClick={handleCancel} disabled={cancelling} className="flex-1 rounded-md bg-brand-danger py-2 text-xs font-semibold text-white disabled:opacity-60">
                      {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
                    </button>
                    <button onClick={() => setConfirmCancel(false)} className="flex-1 rounded-md border border-brand-border py-2 text-xs font-semibold text-brand-dark">No</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmCancel(true)} className="w-full text-sm font-medium text-brand-danger hover:underline">
                  Cancel this order
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
