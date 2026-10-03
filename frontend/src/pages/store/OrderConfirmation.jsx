import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import * as orderService from '@/api/orderService'
import { useToast } from '@/context/ToastContext'
import { OrderDetailsSkeleton } from '@/components/ui/Skeleton'

const PAYMENT_LABEL = { pending: 'Pending', paid: 'Paid', failed: 'Failed' }

export default function OrderConfirmation() {
  const { id } = useParams()
  const toast = useToast()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    orderService
      .getOrder(id)
      .then(({ data }) => setOrder(data))
      .catch((err) => toast.error(err.message || 'Could not load this order.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <OrderDetailsSkeleton />
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <CheckCircle2 size={56} className="mx-auto text-brand-success" />
      <h1 className="mt-5 font-brand-display text-2xl font-semibold text-brand-dark">Order placed successfully!</h1>
      <p className="mt-2 text-sm text-gray-500">Thank you for shopping with FashionMart.</p>

      <div className="mt-6 space-y-2 rounded-xl border border-brand-border bg-white p-5 text-left text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Order Number</span><span className="font-semibold text-brand-dark">{order.order_number}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-semibold text-brand-dark">৳{Number(order.total).toLocaleString()}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Payment Status</span><span className="font-semibold text-brand-dark">{PAYMENT_LABEL[order.payment_status] || order.payment_status}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Estimated Delivery</span><span className="font-semibold text-brand-dark">2-5 business days</span></div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Link to={`/account/orders/${order.id}`} className="rounded-md bg-brand-primary py-3 text-sm font-semibold text-white hover:bg-brand-primary-dark">
          VIEW ORDER
        </Link>
        <Link to={`/account/orders/${order.id}/invoice`} className="rounded-md border border-brand-dark py-3 text-sm font-semibold text-brand-dark hover:bg-brand-light">
          VIEW INVOICE
        </Link>
        <Link to="/shop" className="py-2 text-sm font-medium text-gray-500 hover:text-brand-primary">
          CONTINUE SHOPPING
        </Link>
      </div>
    </div>
  )
}
