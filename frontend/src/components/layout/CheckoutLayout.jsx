import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useEffect } from 'react'
import Breadcrumb from '@/components/store/Breadcrumb'
import { useCart } from '@/context/CartContext'

const STEPS = [
  { key: 'address', label: 'Address', path: '/checkout/address' },
  { key: 'shipping', label: 'Shipping', path: '/checkout/shipping' },
  { key: 'review', label: 'Review', path: '/checkout/review' },
  { key: 'payment', label: 'Payment', path: '/checkout/payment' },
]

export default function CheckoutLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { items, loading } = useCart()

  const currentIndex = Math.max(0, STEPS.findIndex((s) => location.pathname.startsWith(s.path)))

  // Spec section 61: cart cannot be empty going into checkout.
  useEffect(() => {
    if (!loading && items.length === 0) {
      navigate('/cart', { replace: true })
    }
  }, [loading, items.length, navigate])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />

      {/* Progress — compact on mobile, full labels on desktop */}
      <div className="mt-5 flex items-center justify-center">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                  i < currentIndex
                    ? 'border-brand-primary bg-brand-primary text-white'
                    : i === currentIndex
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-brand-border text-gray-400'
                }`}
              >
                {i < currentIndex ? <Check size={16} /> : String(i + 1).padStart(2, '0')}
              </div>
              <span className={`hidden text-xs font-medium sm:block ${i === currentIndex ? 'text-brand-dark' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 h-0.5 w-8 sm:w-16 ${i < currentIndex ? 'bg-brand-primary' : 'bg-brand-border'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  )
}
