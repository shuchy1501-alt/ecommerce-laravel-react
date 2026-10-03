import { useNavigate } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'

export default function CheckoutReview() {
  const { items, subtotal, discount, shipping, total, coupon, shippingMethod, validateCart } = useCart()
  const toast = useToast()
  const navigate = useNavigate()

  const handleContinue = async () => {
    try {
      const data = await validateCart()
      if (!data.valid) {
        toast.warning((data.errors || [])[0] || 'Please review your cart before continuing.')
        return
      }
      navigate('/checkout/payment')
    } catch (err) {
      toast.error(err.message || 'Could not validate your order.')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-brand-display text-xl font-semibold text-brand-dark">Review your order</h1>

      <div className="divide-y divide-brand-border rounded-xl border border-brand-border bg-white">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-4">
            <img src={item.image || 'https://placehold.co/120x160?text=No+Image'} alt={item.name} className="h-16 w-14 flex-shrink-0 rounded object-cover" />
            <div className="flex-1">
              <p className="text-sm font-medium text-brand-dark">{item.name}</p>
              <p className="text-xs text-gray-500">
                {item.color ? `${item.color} · ` : ''}{item.size ? `${item.size} · ` : ''}Qty {item.quantity} × ৳{Number(item.unit_price).toLocaleString()}
              </p>
            </div>
            <span className="font-brand-display text-sm font-semibold text-brand-dark">৳{Number(item.subtotal).toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-brand-dark">Order Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="text-brand-dark">৳{Number(subtotal).toLocaleString()}</span></div>
          {coupon && (
            <div className="flex justify-between text-brand-success"><span>Coupon ({coupon.code})</span><span>-৳{Number(discount).toLocaleString()}</span></div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Shipping {shippingMethod ? `(${shippingMethod.name})` : ''}</span>
            <span className="text-brand-dark">৳{Number(shipping).toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t border-brand-border pt-2 text-base font-semibold text-brand-dark">
            <span>Grand Total</span><span>৳{Number(total).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between border-t border-brand-border pt-4">
        <button onClick={() => navigate('/checkout/shipping')} className="rounded-md border border-brand-border px-6 py-3 text-sm font-semibold text-brand-dark hover:bg-brand-light">
          BACK
        </button>
        <button onClick={handleContinue} className="rounded-md bg-brand-primary px-8 py-3 text-sm font-semibold text-white hover:bg-brand-primary-dark">
          CONTINUE TO PAYMENT
        </button>
      </div>
    </div>
  )
}
