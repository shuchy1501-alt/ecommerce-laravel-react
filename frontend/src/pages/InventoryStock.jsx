import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import { useToast } from '@/context/ToastContext'
import { getStock } from '@/api/inventoryService'

const money = (v) => `৳${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`

const STATUS_TONE = { in_stock: 'success', low_stock: 'warning', out_of_stock: 'danger' }
const STATUS_LABEL = { in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock' }

export default function InventoryStock() {
  const toast = useToast?.()
  const [params, setParams] = useSearchParams()
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)

  const page = Number(params.get('page') || 1)
  const search = params.get('search') || ''
  const stockStatus = params.get('stock_status') || ''

  const update = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => {
      if (v) next.set(k, v)
      else next.delete(k)
    })
    if (!('page' in patch)) next.set('page', '1')
    setParams(next)
  }

  useEffect(() => {
    setLoading(true)
    getStock({ page, search: search || undefined, stock_status: stockStatus || undefined, per_page: 20 })
      .then((res) => {
        setRows(res.data || [])
        setMeta(res.meta || null)
      })
      .catch((err) => toast?.error?.(err.message || 'Failed to load stock.'))
      .finally(() => setLoading(false))
  }, [page, search, stockStatus])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Stock</h1>
        {meta && <span className="text-xs text-stone">{meta.total} items</span>}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          defaultValue={search}
          onChange={(e) => update({ search: e.target.value })}
          placeholder="Search by product, SKU, size, color..."
          className="w-full max-w-sm rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        />
        <select
          value={stockStatus}
          onChange={(e) => update({ stock_status: e.target.value })}
          className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        >
          <option value="">All Stock Status</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {loading && <div className="h-64 animate-pulse rounded-sm bg-bone-dim" />}

      {!loading && rows.length === 0 && (
        <div className="rounded-sm border border-dashed border-stone-light bg-white p-10 text-center text-sm text-stone">
          No stock items found.
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-light bg-bone-dim/60 text-[11px] uppercase tracking-wider text-stone">
                <th className="px-4 py-3 font-utility">Product</th>
                <th className="px-4 py-3 font-utility">SKU</th>
                <th className="px-4 py-3 font-utility">Variant</th>
                <th className="px-4 py-3 font-utility">Cost Price</th>
                <th className="px-4 py-3 font-utility">Selling Price</th>
                <th className="px-4 py-3 font-utility">Stock</th>
                <th className="px-4 py-3 font-utility">Min. Stock</th>
                <th className="px-4 py-3 font-utility">Status</th>
                <th className="px-4 py-3 font-utility text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.variant_id} className="border-b border-stone-light last:border-0">
                  <td className="px-4 py-3">
                    <p className="text-ink">{row.product_name}</p>
                    <p className="text-xs text-stone">{row.category}{row.brand ? ` · ${row.brand}` : ''}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-stone">{row.sku}</td>
                  <td className="px-4 py-3 text-stone">{[row.size, row.color].filter(Boolean).join(' / ') || '—'}</td>
                  <td className="px-4 py-3 text-stone">{money(row.cost_price)}</td>
                  <td className="px-4 py-3 text-stone">{money(row.selling_price)}</td>
                  <td className="px-4 py-3 font-medium text-ink">{row.stock}</td>
                  <td className="px-4 py-3 text-stone">{row.minimum_stock}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[row.stock_status]}>{STATUS_LABEL[row.stock_status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/inventory/stock/${row.variant_id}`} className="text-xs font-medium text-oxblood hover:underline">
                      View
                    </Link>
                  </td>
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
