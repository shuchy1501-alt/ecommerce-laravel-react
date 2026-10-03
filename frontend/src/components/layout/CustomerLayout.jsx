import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  User,
  MapPin,
  Heart,
  Package,
  RotateCcw,
  Star,
  Settings,
  KeyRound,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const NAV_ITEMS = [
  { to: '/account', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/account/profile', label: 'My Profile', icon: User },
  { to: '/account/addresses', label: 'My Addresses', icon: MapPin },
  { to: '/account/wishlist', label: 'My Wishlist', icon: Heart },
  { to: '/account/orders', label: 'My Orders', icon: Package },
  { to: '/account/returns', label: 'My Returns', icon: RotateCcw },
  { to: '/account/reviews', label: 'My Reviews', icon: Star },
  { to: '/account/settings', label: 'Settings', icon: Settings },
  { to: '/account/change-password', label: 'Change Password', icon: KeyRound },
]

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'U'
}

export default function CustomerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
      isActive ? 'bg-brand-dark text-white' : 'text-gray-600 hover:bg-brand-light hover:text-brand-dark'
    }`

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Account header */}
      <div className="mb-6 flex items-center gap-4 rounded-xl border border-brand-border bg-white p-5">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt={user.name} className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-lg font-semibold text-white">
            {initials(user?.name)}
          </div>
        )}
        <div>
          <p className="font-brand-display text-lg font-semibold text-brand-dark">{user?.name || 'My Account'}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      {/* Mobile nav toggle */}
      <div className="mb-4 lg:hidden">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-md border border-brand-border bg-white px-4 py-3 text-sm font-medium text-brand-dark"
        >
          Account Menu
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        {mobileOpen && (
          <nav className="mt-2 flex flex-col gap-1 rounded-md border border-brand-border bg-white p-2">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileOpen(false)} className={navLinkClass}>
                <item.icon size={16} /> {item.label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-md px-4 py-2.5 text-left text-sm font-medium text-brand-danger hover:bg-brand-light"
            >
              <LogOut size={16} /> Logout
            </button>
          </nav>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 flex flex-col gap-1 rounded-xl border border-brand-border bg-white p-3">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                <item.icon size={16} /> {item.label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-md px-4 py-2.5 text-left text-sm font-medium text-brand-danger hover:bg-brand-light"
            >
              <LogOut size={16} /> Logout
            </button>
          </nav>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
