import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { getPurchases } from '@/api/purchaseService'

const money = (v) => `৳${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
const STATUS_TONE = { draft: 'neutral', ordered: 'warning', partially_received: 'warning', received: 'success', cancelled: 'danger' }

export default function Purchases() {
  const toast = useToast?.()
  const { can } = useAuth()
  const [params, setParams] = useSearchParams()
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)

  const page = Number(params.get('page') || 1)
  const search = params.get('search') || ''
  const status = params.get('status') || ''

  const update = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    if (!('page' in patch)) next.set('page', '1')
    setParams(next)
  }

  useEffect(() => {
    setLoading(true)
    getPurchases({ page, search: search || undefined, status: status || undefined, per_page: 20 })
      .then((res) => {
        setRows(res.data || [])
        setMeta(res.meta || null)
      })
      .catch((err) => toast?.error?.(err.message || 'Failed to load purchases.'))
      .finally(() => setLoading(false))
  }, [page, search, status])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Purchases</h1>
        {can('purchases.create') && (
          <Button as={Link} to="/admin/purchases/create">
            + New Purchase
          </Button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          defaultValue={search}
          onChange={(e) => update({ search: e.target.value })}
          placeholder="Search by purchase # or supplier..."
          className="w-full max-w-sm rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        />
        <select
          value={status}
          onChange={(e) => update({ status: e.target.value })}
          className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="ordered">Ordered</option>
          <option value="partially_received">Partially Received</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {meta && <span className="text-xs text-stone">{meta.total} purchases</span>}
      </div>

      {loading && <div className="h-64 animate-pulse rounded-sm bg-bone-dim" />}

      {!loading && rows.length === 0 && (
        <div className="rounded-sm border border-dashed border-stone-light bg-white p-10 text-center text-sm text-stone">
          No purchases found.
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-light bg-bone-dim/60 text-[11px] uppercase tracking-wider text-stone">
                <th className="px-4 py-3 font-utility">Purchase #</th>
                <th className="px-4 py-3 font-utility">Supplier</th>
                <th className="px-4 py-3 font-utility">Date</th>
                <th className="px-4 py-3 font-utility">Items</th>
                <th className="px-4 py-3 font-utility">Total</th>
                <th className="px-4 py-3 font-utility">Status</th>
                <th className="px-4 py-3 font-utility text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-stone-light last:border-0">
                  <td className="px-4 py-3">
                    <Link to={`/admin/purchases/${p.id}`} className="text-ink hover:underline">{p.purchase_number}</Link>
                  </td>
                  <td className="px-4 py-3 text-stone">{p.supplier?.name}</td>
                  <td className="px-4 py-3 text-stone">{p.purchase_date}</td>
                  <td className="px-4 py-3 text-stone">{p.items_count}</td>
                  <td className="px-4 py-3 text-ink">{money(p.total)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[p.status]}>{p.status.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/purchases/${p.id}`} className="text-xs font-medium text-oxblood hover:underline">
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
