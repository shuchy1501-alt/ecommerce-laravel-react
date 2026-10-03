import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Truck, Smartphone, CheckCircle2 } from 'lucide-react'
import * as checkoutService from '@/api/checkoutService'
import * as orderService from '@/api/orderService'
import * as paymentService from '@/api/paymentService'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { PaymentSkeleton } from '@/components/ui/Skeleton'

const METHODS = [
  { value: 'cod', label: 'Cash on Delivery', icon: Truck, blurb: 'Pay with cash when your order arrives.' },
  { value: 'bkash', label: 'bKash', icon: Smartphone, blurb: 'Pay instantly using your bKash account.' },
  { value: 'nagad', label: 'Nagad', icon: Smartphone, blurb: 'Pay instantly using your Nagad account.' },
  { value: 'card', label: 'Debit / Credit Card', icon: CreditCard, blurb: 'Visa, Mastercard, or local cards.' },
]

// Phase 9: no real payment gateway is configured yet, so online methods run
// through a clearly-labeled sandbox confirmation step instead of a real
// hosted checkout page. Swapping in bKash/Nagad/card later only touches the
// backend gateway class — this screen already talks to the same API shape.
export default function CheckoutPayment() {
  const { total, fetchCart } = useCart()
  const toast = useToast()
  const navigate = useNavigate()

  const [checking, setChecking] = useState(true)
  const [ready, setReady] = useState(false)
  const [method, setMethod] = useState('cod')
  const [placing, setPlacing] = useState(false)
  const [order, setOrder] = useState(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    checkoutService
      .validateCheckout()
      .then(({ data }) => {
        setReady(data.valid)
        if (!data.valid) {
          toast.warning((data.errors || [])[0] || 'Please resolve the issues in your order before payment.')
        }
      })
      .catch((err) => toast.error(err.message || 'Could not validate checkout.'))
      .finally(() => setChecking(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePlaceOrder = async () => {
    setPlacing(true)
    try {
      const { data } = await orderService.placeOrder(method)
      setOrder(data)
      fetchCart() // cart is now cleared server-side
      if (method === 'cod') {
        toast.success('Order placed successfully!')
        navigate(`/order-confirmation/${data.id}`)
      }
    } catch (err) {
      toast.error(err.message || 'Could not place your order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  const handleSimulatePayment = async () => {
    const payment = order?.payments?.[0]
    if (!payment) return
    setVerifying(true)
    try {
      const { data } = await paymentService.verifyPayment(payment.transaction_id, payment.signature)
      if (data.status === 'paid') {
        toast.success('Payment successful!')
        navigate(`/order-confirmation/${order.id}`)
      } else {
        toast.error('Payment could not be completed. Please try again.')
      }
    } catch (err) {
      toast.error(err.message || 'Payment verification failed.')
    } finally {
      setVerifying(false)
    }
  }

  if (checking) return <PaymentSkeleton />

  // Order created, awaiting sandbox payment confirmation (online methods only).
  if (order) {
    const payment = order.payments?.[0]
    return (
      <div className="mx-auto max-w-lg space-y-6 py-6 text-center">
        <Smartphone size={40} className="mx-auto text-brand-primary" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-warning">Sandbox / Test Mode</p>
          <h1 className="mt-1 font-brand-display text-xl font-semibold text-brand-dark">Confirm your {method} payment</h1>
        </div>
        <div className="rounded-xl border border-brand-border bg-white p-5 text-left text-sm">
          <div className="flex justify-between py-1"><span className="text-gray-500">Order Number</span><span className="font-medium text-brand-dark">{order.order_number}</span></div>
          <div className="flex justify-between py-1"><span className="text-gray-500">Amount</span><span className="font-medium text-brand-dark">৳{Number(order.total).toLocaleString()}</span></div>
          <div className="flex justify-between py-1"><span className="text-gray-500">Transaction ID</span><span className="font-mono text-xs text-brand-dark">{payment?.transaction_id}</span></div>
        </div>
        <p className="text-xs text-gray-400">No real payment is processed — this simulates a gateway confirmation for demo purposes.</p>
        <button
          onClick={handleSimulatePayment}
          disabled={verifying}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-primary py-3 text-sm font-semibold text-white hover:bg-brand-primary-dark disabled:opacity-60"
        >
          <CheckCircle2 size={16} /> {verifying ? 'Confirming…' : 'Simulate Successful Payment'}
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-4">
      <h1 className="text-center font-brand-display text-xl font-semibold text-brand-dark">Select a payment method</h1>

      <div className="space-y-3">
        {METHODS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMethod(m.value)}
            className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
              method === m.value ? 'border-brand-primary bg-brand-light' : 'border-brand-border bg-white hover:border-brand-dark'
            }`}
          >
            <m.icon size={20} className="text-brand-dark" />
            <div>
              <p className="font-medium text-brand-dark">{m.label}</p>
              <p className="text-xs text-gray-500">{m.blurb}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-brand-border pt-4 text-base font-semibold text-brand-dark">
        <span>Total to pay</span>
        <span>৳{Number(total).toLocaleString()}</span>
      </div>

      <div className="flex justify-between">
        <button onClick={() => navigate('/checkout/review')} className="rounded-md border border-brand-border px-6 py-3 text-sm font-semibold text-brand-dark hover:bg-brand-light">
          BACK
        </button>
        <button
          onClick={handlePlaceOrder}
          disabled={!ready || placing}
          className="rounded-md bg-brand-primary px-8 py-3 text-sm font-semibold text-white hover:bg-brand-primary-dark disabled:opacity-50"
        >
          {placing ? 'Placing Order…' : 'PLACE ORDER'}
        </button>
      </div>
      {!ready && <p className="text-center text-xs text-brand-danger">Please go back and resolve the issues with your order.</p>}
    </div>
  )
}
