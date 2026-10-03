import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { getStockDetail } from '@/api/inventoryService'

const money = (v) => `৳${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
const STATUS_TONE = { in_stock: 'success', low_stock: 'warning', out_of_stock: 'danger' }
const STATUS_LABEL = { in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock' }

export default function InventoryStockDetail() {
  const { id } = useParams()
  const toast = useToast?.()
  const [item, setItem] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getStockDetail(id)
      .then((res) => {
        setItem(res.data.item)
        setHistory(res.data.history || [])
      })
      .catch((err) => toast?.error?.(err.message || 'Failed to load stock detail.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="h-64 animate-pulse rounded-sm bg-bone-dim" />
  if (!item) return null

  return (
    <div>
      <Link to="/admin/inventory/stock" className="mb-4 inline-block text-xs font-medium text-oxblood hover:underline">
        ← Back to Stock
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink">{item.product_name}</h1>
          <p className="text-sm text-stone">
            {item.sku} · {[item.size, item.color].filter(Boolean).join(' / ') || 'No variant attributes'}
          </p>
        </div>
        <Badge tone={STATUS_TONE[item.stock_status]}>{STATUS_LABEL[item.stock_status]}</Badge>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-sm border border-stone-light bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-stone">Current Stock</p>
          <p className="mt-1 font-display text-xl text-ink">{item.stock}</p>
        </div>
        <div className="rounded-sm border border-stone-light bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-stone">Minimum Stock</p>
          <p className="mt-1 font-display text-xl text-ink">{item.minimum_stock}</p>
        </div>
        <div className="rounded-sm border border-stone-light bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-stone">Cost Price</p>
          <p className="mt-1 font-display text-xl text-ink">{money(item.cost_price)}</p>
        </div>
        <div className="rounded-sm border border-stone-light bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-stone">Selling Price</p>
          <p className="mt-1 font-display text-xl text-ink">{money(item.selling_price)}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg text-ink">Stock Card</h2>
        <Button as={Link} to={`/admin/inventory/adjustments?variant_id=${item.variant_id}`} size="sm" variant="outline">
          Adjust Stock
        </Button>
      </div>

      <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-stone-light bg-bone-dim/60 text-[11px] uppercase tracking-wider text-stone">
              <th className="px-4 py-3 font-utility">Date</th>
              <th className="px-4 py-3 font-utility">Type</th>
              <th className="px-4 py-3 font-utility">Reference</th>
              <th className="px-4 py-3 font-utility text-right">In</th>
              <th className="px-4 py-3 font-utility text-right">Out</th>
              <th className="px-4 py-3 font-utility text-right">Balance</th>
              <th className="px-4 py-3 font-utility">User</th>
              <th className="px-4 py-3 font-utility">Note</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-stone">
                  No stock movements recorded yet.
                </td>
              </tr>
            )}
            {history.map((m) => (
              <tr key={m.id} className="border-b border-stone-light last:border-0">
                <td className="px-4 py-3 text-stone">{new Date(m.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 capitalize text-ink">{m.type.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-xs text-stone">
                  {m.reference_type ? `${m.reference_type} #${m.reference_id}` : '—'}
                </td>
                <td className="px-4 py-3 text-right text-success">{m.stock_in ?? ''}</td>
                <td className="px-4 py-3 text-right text-danger">{m.stock_out ?? ''}</td>
                <td className="px-4 py-3 text-right font-medium text-ink">{m.new_stock}</td>
                <td className="px-4 py-3 text-stone">{m.created_by || 'System'}</td>
                <td className="px-4 py-3 text-xs text-stone">{m.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
