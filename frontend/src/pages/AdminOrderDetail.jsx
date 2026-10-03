import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { fetchOrder, updateOrderStatus, updatePaymentStatus, cancelOrder } from '@/api/orders'
import { useToast } from '@/context/ToastContext'

const NEXT_STATUS = {
  pending: [{ value: 'confirmed', label: 'Confirm' }],
  confirmed: [{ value: 'processing', label: 'Start Processing' }],
  processing: [{ value: 'packed', label: 'Mark Packed' }],
  packed: [{ value: 'shipped', label: 'Mark Shipped' }],
  shipped: [{ value: 'delivered', label: 'Mark Delivered' }],
  delivered: [],
  cancelled: [],
}

function formatCurrency(value) {
  return `৳${Number(value).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const load = () => {
    setLoading(true)
    fetchOrder(id)
      .then((res) => setOrder(res.data))
      .catch((err) => toast.error(err.message || 'Could not load this order.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (status) => {
    setUpdating(true)
    try {
      await updateOrderStatus(id, status)
      toast.success('Order status updated successfully.')
      load()
    } catch (err) {
      toast.error(err.message || 'Could not update order status.')
    } finally {
      setUpdating(false)
    }
  }

  const handleVerifyPayment = async () => {
    setUpdating(true)
    try {
      await updatePaymentStatus(id, 'paid')
      toast.success('Payment marked as paid.')
      load()
    } catch (err) {
      toast.error(err.message || 'Could not update payment status.')
    } finally {
      setUpdating(false)
    }
  }

  const handleCancel = async () => {
    setUpdating(true)
    try {
      await cancelOrder(id, 'Cancelled by admin.')
      toast.success('Order cancelled successfully.')
      setConfirmCancel(false)
      load()
    } catch (err) {
      toast.error(err.message || 'This order can no longer be cancelled.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div className="rounded-sm border border-stone-light bg-white p-10 text-center text-sm text-stone">Loading order…</div>
  }
  if (!order) return null

  const nextActions = NEXT_STATUS[order.order_status] || []
  const canCancel = ['pending', 'confirmed', 'processing'].includes(order.order_status)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/orders" className="text-xs text-stone hover:underline">← Back to Orders</Link>
          <h1 className="mt-1 font-display text-2xl text-ink">{order.order_number}</h1>
          <p className="text-xs text-stone">Placed {order.placed_at ? new Date(order.placed_at).toLocaleString() : ''}</p>
        </div>
        <Link to={`/admin/orders/${order.id}/invoice`} className="rounded-sm border border-ink px-4 py-2 text-sm text-ink hover:bg-ink hover:text-bone">
          View Invoice
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-sm border border-stone-light bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-ink">Order Status</h2>
              <Badge tone={order.order_status === 'delivered' ? 'success' : order.order_status === 'cancelled' ? 'danger' : 'accent'}>
                {order.order_status}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {nextActions.map((action) => (
                <Button key={action.value} size="sm" onClick={() => handleStatusChange(action.value)} loading={updating}>
                  {action.label}
                </Button>
              ))}
              {canCancel && !confirmCancel && (
                <Button size="sm" variant="danger" onClick={() => setConfirmCancel(true)}>Cancel Order</Button>
              )}
              {confirmCancel && (
                <>
                  <Button size="sm" variant="danger" onClick={handleCancel} loading={updating}>Confirm Cancel</Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(false)}>Back</Button>
                </>
              )}
            </div>
          </div>

          <div className="divide-y divide-stone-light rounded-sm border border-stone-light bg-white">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="font-medium text-ink">{item.product_name}</p>
                  <p className="text-xs text-stone">
                    SKU {item.sku} · {[item.color, item.size].filter(Boolean).join(' / ') || 'N/A'} · Qty {item.quantity}
                  </p>
                </div>
                <span className="font-medium text-ink">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {order.status_history?.length > 0 && (
            <div className="rounded-sm border border-stone-light bg-white p-5">
              <h2 className="mb-3 text-sm font-medium text-ink">Status History</h2>
              <div className="space-y-2 text-xs text-stone">
                {order.status_history.map((h, i) => (
                  <div key={i} className="flex justify-between border-b border-stone-light/60 pb-2 last:border-0">
                    <span className="capitalize text-ink">{h.from_status || 'created'} → {h.to_status}</span>
                    <span>{h.created_at ? new Date(h.created_at).toLocaleString() : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-sm border border-stone-light bg-white p-5 text-sm">
            <h2 className="mb-3 font-medium text-ink">Customer</h2>
            <p className="font-medium text-ink">{order.customer?.name}</p>
            <p className="text-stone">{order.customer?.phone}</p>
            <p className="text-stone">{order.customer?.email}</p>
          </div>

          <div className="rounded-sm border border-stone-light bg-white p-5 text-sm">
            <h2 className="mb-3 font-medium text-ink">Shipping Address</h2>
            <p className="text-stone">{order.shipping?.address}</p>
            <p className="text-stone">{[order.shipping?.district, order.shipping?.division].filter(Boolean).join(', ')}</p>
          </div>

          <div className="rounded-sm border border-stone-light bg-white p-5 text-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium text-ink">Payment</h2>
              <Badge tone={order.payment_status === 'paid' ? 'success' : order.payment_status === 'failed' ? 'danger' : 'neutral'}>
                {order.payment_status}
              </Badge>
            </div>
            <p className="text-stone">Method: <span className="uppercase text-ink">{order.payment_method}</span></p>
            {order.payments?.[0]?.transaction_id && (
              <p className="mt-1 font-mono text-xs text-stone">{order.payments[0].transaction_id}</p>
            )}
            {order.payment_status !== 'paid' && (
              <Button size="sm" className="mt-3 w-full" onClick={handleVerifyPayment} loading={updating}>
                Verify &amp; Mark Paid
              </Button>
            )}
          </div>

          <div className="rounded-sm border border-stone-light bg-white p-5 text-sm">
            <h2 className="mb-3 font-medium text-ink">Order Summary</h2>
            <div className="space-y-1.5">
              <div className="flex justify-between text-stone"><span>Subtotal</span><span className="text-ink">{formatCurrency(order.subtotal)}</span></div>
              {order.coupon_discount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>-{formatCurrency(order.coupon_discount)}</span></div>}
              <div className="flex justify-between text-stone"><span>Shipping</span><span className="text-ink">{formatCurrency(order.shipping_charge)}</span></div>
              <div className="flex justify-between border-t border-stone-light pt-1.5 font-medium text-ink"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
