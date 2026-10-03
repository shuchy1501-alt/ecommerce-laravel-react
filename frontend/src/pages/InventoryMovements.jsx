import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Pagination from '@/components/ui/Pagination'
import { useToast } from '@/context/ToastContext'
import { getMovements } from '@/api/inventoryService'

const TYPES = ['opening', 'purchase', 'sale', 'sales_return', 'purchase_return', 'damage', 'adjustment_in', 'adjustment_out', 'cancellation']

export default function InventoryMovements() {
  const toast = useToast?.()
  const [params, setParams] = useSearchParams()
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)

  const page = Number(params.get('page') || 1)
  const search = params.get('search') || ''
  const type = params.get('type') || ''

  const update = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    if (!('page' in patch)) next.set('page', '1')
    setParams(next)
  }

  useEffect(() => {
    setLoading(true)
    getMovements({ page, search: search || undefined, type: type || undefined, per_page: 20 })
      .then((res) => {
        setRows(res.data || [])
        setMeta(res.meta || null)
      })
      .catch((err) => toast?.error?.(err.message || 'Failed to load stock movements.'))
      .finally(() => setLoading(false))
  }, [page, search, type])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Stock Movements</h1>
        {meta && <span className="text-xs text-stone">{meta.total} movements</span>}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          defaultValue={search}
          onChange={(e) => update({ search: e.target.value })}
          placeholder="Search by product or SKU..."
          className="w-full max-w-sm rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        />
        <select
          value={type}
          onChange={(e) => update({ type: e.target.value })}
          className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        >
          <option value="">All Types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="h-64 animate-pulse rounded-sm bg-bone-dim" />}

      {!loading && (
        <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-light bg-bone-dim/60 text-[11px] uppercase tracking-wider text-stone">
                <th className="px-4 py-3 font-utility">Date</th>
                <th className="px-4 py-3 font-utility">Product</th>
                <th className="px-4 py-3 font-utility">Type</th>
                <th className="px-4 py-3 font-utility text-right">In</th>
                <th className="px-4 py-3 font-utility text-right">Out</th>
                <th className="px-4 py-3 font-utility text-right">Balance</th>
                <th className="px-4 py-3 font-utility">User</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-stone">
                    No stock movements found.
                  </td>
                </tr>
              )}
              {rows.map((m) => (
                <tr key={m.id} className="border-b border-stone-light last:border-0">
                  <td className="px-4 py-3 text-stone">{new Date(m.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/inventory/stock/${m.variant_id}`} className="text-ink hover:underline">
                      {m.product_name}
                    </Link>
                    <p className="text-xs text-stone">{m.sku}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-stone">{m.type.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-right text-success">{m.stock_in ?? ''}</td>
                  <td className="px-4 py-3 text-right text-danger">{m.stock_out ?? ''}</td>
                  <td className="px-4 py-3 text-right font-medium text-ink">{m.new_stock}</td>
                  <td className="px-4 py-3 text-stone">{m.created_by || 'System'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {meta && (
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              total={meta.total}
              perPage={meta.per_page}
              onPageChange={(p) => update({ page: String(p) })}
            />
          )}
        </div>
      )}
    </div>
  )
}
