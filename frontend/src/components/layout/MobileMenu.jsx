import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X, ChevronDown, User, LogOut } from 'lucide-react'
import { useTaxonomy } from '@/hooks/useTaxonomy'
import { useAuth } from '@/context/AuthContext'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'New Arrivals', href: '/shop?sort=newest' },
  { label: 'Sale', href: '/shop?sale=1' },
]

export default function MobileMenu({ open, onClose }) {
  const [expanded, setExpanded] = useState(null)
  const { isAuthenticated, user, logout } = useAuth()
  const { categories } = useTaxonomy()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-brand-dark/50" onClick={onClose} aria-hidden="true" />
      <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="Menu">
        <div className="flex items-center justify-between border-b border-brand-border px-4 py-4">
          <span className="font-brand-display text-xl font-bold text-brand-dark">FASHIONMART</span>
          <button onClick={onClose} aria-label="Close menu" className="rounded p-1 text-brand-dark hover:bg-brand-light">
            <X size={22} />
          </button>
        </div>

        <div className="px-4 py-3">
          {isAuthenticated ? (
            <div className="flex items-center justify-between rounded-md bg-brand-light px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-brand-dark"><User size={16} /> {user?.name || 'My Account'}</span>
              <button onClick={logout} className="flex items-center gap-1 text-xs text-brand-danger"><LogOut size={14} /> Logout</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" onClick={onClose} className="flex-1 rounded-md border border-brand-dark py-2 text-center text-sm font-medium text-brand-dark">Login</Link>
              <Link to="/register" onClick={onClose} className="flex-1 rounded-md bg-brand-primary py-2 text-center text-sm font-medium text-white">Register</Link>
            </div>
          )}
        </div>

        <nav className="px-4 py-2">
          {NAV_LINKS.map((l) => (
            <Link key={l.label} to={l.href} onClick={onClose} className="block border-b border-brand-border py-3 text-sm font-medium text-brand-dark">
              {l.label}
            </Link>
          ))}

          {categories.map((category) => (
            <div key={category.id} className="border-b border-brand-border">
              <button
                type="button"
                onClick={() => setExpanded(expanded === category.id ? null : category.id)}
                aria-expanded={expanded === category.id}
                className="flex w-full items-center justify-between py-3 text-sm font-medium text-brand-dark"
              >
                {category.name}
                <ChevronDown size={16} className={`transition-transform ${expanded === category.id ? 'rotate-180' : ''}`} />
              </button>
              {expanded === category.id && (
                <ul className="pb-3 pl-3">
                  {(category.subcategories || []).map((sub) => (
                    <li key={sub.id}>
                      <Link
                        to={`/shop?category=${category.slug}&subcategory=${sub.slug}`}
                        onClick={onClose}
                        className="block py-2 text-sm text-gray-600"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}
