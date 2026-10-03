import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Heart, ShoppingBag, User, Menu, X, LogOut, Package } from 'lucide-react'
import MegaMenu from './MegaMenu'
import MobileMenu from './MobileMenu'
import NotificationBell from './NotificationBell'
import CartDrawer from '@/components/store/CartDrawer'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop', mega: true },
  { label: 'Men', href: '/shop?category=men' },
  { label: 'Women', href: '/shop?category=women' },
  { label: 'Kids', href: '/shop?category=kids' },
  { label: 'Shoes', href: '/shop?category=shoes' },
  { label: 'Accessories', href: '/shop?category=accessories' },
  { label: 'New Arrivals', href: '/shop?sort=newest' },
  { label: 'Sale', href: '/shop?sale=1' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const accountRef = useRef(null)

  const { isAuthenticated, user, logout } = useAuth()
  const { itemCount } = useCart()
  const { count: wishCount } = useWishlist()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const submitSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    setSearchOpen(false)
  }

  // Debounce navigation while the visitor types so /search only updates
  // (and re-fetches) a moment after typing pauses, not on every keystroke.
  useEffect(() => {
    if (!searchOpen || !query.trim()) return
    const timer = setTimeout(() => {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`, { replace: true })
    }, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <header className={`sticky top-0 z-40 bg-white transition-shadow ${scrolled ? 'shadow-md' : 'border-b border-brand-border'}`}>
      <div className={`mx-auto flex max-w-7xl items-center justify-between px-4 transition-all sm:px-6 lg:px-8 ${scrolled ? 'py-2.5' : 'py-4'}`}>
        <button className="p-1 text-brand-dark lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu size={24} />
        </button>

        <Link to="/" className="font-brand-display text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">
          FASHIONMART
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) =>
            l.mega ? (
              <div key={l.label} className="relative" onMouseEnter={() => setMegaOpen(true)} onMouseLeave={() => setMegaOpen(false)}>
                <Link to={l.href} className="text-sm font-medium text-brand-dark transition-colors hover:text-brand-primary">
                  {l.label}
                </Link>
                {megaOpen && <MegaMenu onNavigate={() => setMegaOpen(false)} />}
              </div>
            ) : (
              <Link key={l.label} to={l.href} className="text-sm font-medium text-brand-dark transition-colors hover:text-brand-primary">
                {l.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button onClick={() => setSearchOpen((v) => !v)} aria-label="Search" className="rounded-full p-2 text-brand-dark hover:bg-brand-light">
            <Search size={20} />
          </button>

          <Link to="/wishlist" aria-label="Wishlist" className="relative hidden rounded-full p-2 text-brand-dark hover:bg-brand-light sm:block">
            <Heart size={20} />
            {wishCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
                {wishCount}
              </span>
            )}
          </Link>

          {isAuthenticated && <NotificationBell variant="customer" />}

          <button onClick={() => setCartOpen(true)} aria-label="Cart" className="relative rounded-full p-2 text-brand-dark hover:bg-brand-light">
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>

          <div className="relative hidden sm:block" ref={accountRef}>
            <button onClick={() => setAccountOpen((v) => !v)} aria-label="Account" aria-expanded={accountOpen} className="rounded-full p-2 text-brand-dark hover:bg-brand-light">
              <User size={20} />
            </button>
            {accountOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-brand-border bg-white py-2 shadow-lg">
                {isAuthenticated ? (
                  <>
                    <div className="border-b border-brand-border px-4 py-2 text-sm font-medium text-brand-dark">{user?.name || 'My Account'}</div>
                    {[
                      { label: 'My Account', href: '/account', icon: User },
                      { label: 'My Orders', href: '/account/orders', icon: Package },
                      { label: 'Wishlist', href: '/wishlist', icon: Heart },
                    ].map((i) => (
                      <Link key={i.label} to={i.href} onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-brand-light">
                        <i.icon size={15} /> {i.label}
                      </Link>
                    ))}
                    <button onClick={() => { logout(); setAccountOpen(false) }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-brand-danger hover:bg-brand-light">
                      <LogOut size={15} /> Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 px-4 py-2">
                    <Link to="/login" onClick={() => setAccountOpen(false)} className="rounded-md border border-brand-dark py-1.5 text-center text-sm font-medium text-brand-dark">Login</Link>
                    <Link to="/register" onClick={() => setAccountOpen(false)} className="rounded-md bg-brand-primary py-1.5 text-center text-sm font-medium text-white">Register</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-brand-border bg-white px-4 py-3 sm:px-6 lg:px-8">
          <form onSubmit={submitSearch} className="mx-auto flex max-w-2xl items-center gap-2">
            <Search size={18} className="text-gray-400" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products, brands and more"
              className="flex-1 border-none bg-transparent text-sm text-brand-dark placeholder:text-gray-400 focus:outline-none"
            />
            <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search" className="text-gray-400 hover:text-brand-dark">
              <X size={18} />
            </button>
          </form>
        </div>
      )}

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  )
}
