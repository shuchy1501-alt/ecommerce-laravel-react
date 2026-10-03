import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/context/ToastContext'
import { getOverview } from '@/api/inventoryService'

const money = (v) => `৳${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`

function StatCard({ label, value, toneClass = 'text-ink', to }) {
  const content = (
    <div className="rounded-sm border border-stone-light bg-white p-5">
      <p className="font-utility text-[11px] uppercase tracking-wider text-stone">{label}</p>
      <p className={`mt-2 font-display text-2xl ${toneClass}`}>{value}</p>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

export default function InventoryDashboard() {
  const toast = useToast?.()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getOverview()
      .then((res) => setData(res.data))
      .catch((err) => toast?.error?.(err.message || 'Failed to load inventory overview.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-sm bg-bone-dim" />
        ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Inventory Overview</h1>
        <div className="flex gap-3">
          <Link to="/admin/purchases/create" className="text-sm font-medium text-oxblood hover:underline">
            + New Purchase
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Products" value={data.total_products} />
        <StatCard label="Total Variants" value={data.total_variants} />
        <StatCard label="Total Stock Units" value={data.total_stock_units} />
        <StatCard label="Inventory Value" value={money(data.total_inventory_value)} />
        <StatCard label="Low Stock" value={data.low_stock_items} toneClass="text-gold" to="/admin/inventory/stock?stock_status=low_stock" />
        <StatCard label="Out of Stock" value={data.out_of_stock_items} toneClass="text-danger" to="/admin/inventory/stock?stock_status=out_of_stock" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-sm border border-stone-light bg-white">
          <div className="flex items-center justify-between border-b border-stone-light px-4 py-3">
            <h2 className="font-display text-base text-ink">Recent Purchases</h2>
            <Link to="/admin/purchases" className="text-xs font-medium text-oxblood hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-stone-light">
            {data.recent_purchases?.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-stone">No purchases yet.</li>
            )}
            {data.recent_purchases?.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <Link to={`/admin/purchases/${p.id}`} className="font-medium text-ink hover:underline">
                    {p.purchase_number}
                  </Link>
                  <p className="text-xs text-stone">{p.supplier?.name} · {p.purchase_date}</p>
                </div>
                <div className="text-right">
                  <p className="text-ink">{money(p.total)}</p>
                  <Badge tone={p.status === 'received' ? 'success' : p.status === 'cancelled' ? 'danger' : 'warning'}>
                    {p.status.replace('_', ' ')}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-sm border border-stone-light bg-white">
          <div className="flex items-center justify-between border-b border-stone-light px-4 py-3">
            <h2 className="font-display text-base text-ink">Recent Stock Movements</h2>
            <Link to="/admin/inventory/movements" className="text-xs font-medium text-oxblood hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-stone-light">
            {data.recent_stock_movements?.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-stone">No stock movements yet.</li>
            )}
            {data.recent_stock_movements?.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{m.product_name}</p>
                  <p className="text-xs text-stone">{m.sku} · {m.type.replace('_', ' ')}</p>
                </div>
                <p className={m.quantity >= 0 ? 'text-success' : 'text-danger'}>
                  {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
