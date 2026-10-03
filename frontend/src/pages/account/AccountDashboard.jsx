import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Clock, CheckCircle2, Heart, ShoppingBag, MapPin } from 'lucide-react'
import * as customerService from '@/api/customerService'
import { useAuth } from '@/context/AuthContext'
import { SkeletonLine, SkeletonCard } from '@/components/ui/Skeleton'

const STAT_CARDS = [
  { key: 'total_orders', label: 'Total Orders', icon: Package, tone: 'text-brand-dark bg-brand-light' },
  { key: 'pending_orders', label: 'Pending Orders', icon: Clock, tone: 'text-brand-warning bg-amber-50' },
  { key: 'completed_orders', label: 'Completed Orders', icon: CheckCircle2, tone: 'text-brand-success bg-green-50' },
  { key: 'wishlist_count', label: 'Wishlist Items', icon: Heart, tone: 'text-brand-primary bg-pink-50' },
]

const QUICK_ACTIONS = [
  { to: '/shop', label: 'Shop Now', icon: ShoppingBag },
  { to: '/account/orders', label: 'View Orders', icon: Package },
  { to: '/account/addresses', label: 'Manage Addresses', icon: MapPin },
  { to: '/account/wishlist', label: 'View Wishlist', icon: Heart },
]

export default function AccountDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    customerService
      .getDashboardStats()
      .then(({ data }) => active && setStats(data))
      .catch(() => active && setError('Could not load your dashboard right now.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-brand-display text-2xl font-semibold text-brand-dark">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Here's what's happening with your account.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-brand-danger">{error}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STAT_CARDS.map((card) => (
            <div key={card.key} className="rounded-xl border border-brand-border bg-white p-4">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full ${card.tone}`}>
                <card.icon size={18} />
              </div>
              <p className="font-brand-display text-2xl font-semibold text-brand-dark">{stats?.[card.key] ?? 0}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="mb-3 font-brand-display text-lg font-semibold text-brand-dark">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="flex flex-col items-center gap-2 rounded-xl border border-brand-border bg-white px-3 py-5 text-center transition-colors hover:border-brand-primary"
            >
              <a.icon size={20} className="text-brand-primary" />
              <span className="text-xs font-medium text-brand-dark">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-brand-display text-lg font-semibold text-brand-dark">Recent Orders</h2>
        {loading ? (
          <SkeletonLine className="h-24 w-full" />
        ) : stats?.recent_orders?.length ? (
          <div className="divide-y divide-brand-border rounded-xl border border-brand-border bg-white">
            {stats.recent_orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-medium text-brand-dark">{o.order_number}</span>
                <span className="capitalize text-gray-500">{o.order_status}</span>
                <span className="font-semibold text-brand-dark">৳{Number(o.total).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-brand-border bg-white px-6 py-10 text-center text-sm text-gray-500">
            No orders yet. <Link to="/shop" className="font-medium text-brand-primary hover:underline">Start shopping</Link>.
          </div>
        )}
      </div>
    </div>
  )
}
