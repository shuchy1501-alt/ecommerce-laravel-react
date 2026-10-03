import { Link } from 'react-router-dom'
import { X, ShoppingBag } from 'lucide-react'
import { useCart } from '@/context/CartContext'

const MAX_VISIBLE = 4

export default function CartDrawer({ open, onClose }) {
  const { items = [], subtotal, total, loading } = useCart()
  const visible = (items || []).slice(0, MAX_VISIBLE)
  const extraCount = items.length - visible.length

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm transform flex-col bg-white shadow-xl transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Cart preview"
        inert={!open}
      >
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
          <h2 className="font-brand-display text-lg font-semibold text-brand-dark">Your Cart</h2>
          <button onClick={onClose} aria-label="Close cart preview" className="text-gray-400 hover:text-brand-dark">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag size={36} className="text-brand-border" />
              <p className="mt-3 text-sm text-gray-500">Your cart is empty.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visible.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <img
                    src={item.image || 'https://placehold.co/120x160?text=No+Image'}
                    alt={item.name}
                    className="h-16 w-14 flex-shrink-0 rounded-md object-cover"
                  />
                  <div className="flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-brand-dark">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.color ? `${item.color} · ` : ''}{item.size ? `${item.size} · ` : ''}Qty {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-brand-dark">৳{Number(item.subtotal).toLocaleString()}</span>
                </div>
              ))}
              {extraCount > 0 && <p className="text-center text-xs text-gray-400">+ {extraCount} more item{extraCount !== 1 ? 's' : ''}</p>}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-brand-border p-5">
            <div className="mb-4 flex justify-between text-sm font-medium text-brand-dark">
              <span>Subtotal</span>
              <span>৳{Number(subtotal || total).toLocaleString()}</span>
            </div>
            <Link
              to="/cart"
              onClick={onClose}
              className="block w-full rounded-md border border-brand-dark py-3 text-center text-sm font-semibold text-brand-dark hover:bg-brand-light"
            >
              VIEW CART
            </Link>
            <Link
              to="/checkout"
              onClick={onClose}
              className="mt-2.5 block w-full rounded-md bg-brand-primary py-3 text-center text-sm font-semibold text-white hover:bg-brand-primary-dark"
            >
              CHECKOUT
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}
