import { Link } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import Breadcrumb from '@/components/store/Breadcrumb'

// Phase 5 only requires the storefront to be able to *start* checkout from
// the cart. The full checkout flow (address, payment, order placement)
// depends on backend order APIs and is intentionally out of scope here —
// this page keeps the journey unbroken and easy to replace in a later phase.
export default function Checkout() {
  const { items, subtotal } = useCart()

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <Breadcrumb items={[{ label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />
      <h1 className="mt-4 font-brand-display text-3xl font-semibold text-brand-dark">Checkout</h1>
      <p className="mt-3 text-sm text-gray-500">
        {items.length} item{items.length !== 1 ? 's' : ''} · Estimated total ৳{subtotal.toLocaleString()}
      </p>
      <p className="mx-auto mt-6 max-w-md rounded-md border border-brand-border bg-brand-light p-4 text-sm text-gray-600">
        Full checkout (address, payment and order placement) connects to the order API in an upcoming phase.
        Your cart is saved — come back anytime to complete your purchase.
      </p>
      <Link to="/shop" className="mt-6 inline-block rounded-md bg-brand-primary px-6 py-3 text-sm font-semibold text-white hover:bg-brand-primary-dark">
        CONTINUE SHOPPING
      </Link>
    </div>
  )
}
