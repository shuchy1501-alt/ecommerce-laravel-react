import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import NotificationBell from './NotificationBell'
import GlobalSearch from './GlobalSearch'

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-stone-light bg-bone/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
          className="rounded-sm p-2 text-ink hover:bg-bone-dim lg:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2.5 5h15M2.5 10h15M2.5 15h15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <a href="/admin" className="hidden font-display text-xl tracking-tight text-ink sm:block">
          FashionMart
        </a>
      </div>

      <div className="hidden flex-1 justify-center md:flex">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell variant="admin" />

        <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-ink hover:bg-bone-dim"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-medium text-bone">
            {(user?.name || 'U').slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden sm:inline">{user?.name || 'Account'}</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-44 rounded-sm border border-stone-light bg-white py-1 shadow-lg">
            <a href="/admin/settings/profile" className="block px-4 py-2 text-sm text-ink hover:bg-bone-dim">
              Profile
            </a>
            <button
              onClick={logout}
              className="block w-full px-4 py-2 text-left text-sm text-danger hover:bg-bone-dim"
            >
              Sign out
            </button>
          </div>
        )}
        </div>
      </div>
    </header>
  )
}
