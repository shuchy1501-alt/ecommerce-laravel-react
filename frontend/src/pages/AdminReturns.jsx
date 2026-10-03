import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import { fetchReturns } from '@/api/returns'
import { useToast } from '@/context/ToastContext'
import { OrderListSkeleton } from '@/components/ui/Skeleton'

function formatCurrency(value) {
  const number = Number(value)
  if (Number.isNaN(number)) return value
  return `৳${number.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
}

function statusTone(status) {
  if (['completed', 'refunded', 'exchange_completed'].includes(status)) return 'success'
  if (['rejected', 'cancelled'].includes(status)) return 'danger'
  if (status === 'requested') return 'neutral'
  return 'accent'
}

const TYPE_OPTIONS = ['', 'return', 'exchange', 'refund']
const STATUS_OPTIONS = [
  '', 'requested', 'approved', 'pickup_scheduled', 'in_transit', 'received', 'inspected',
  'refund_pending', 'refunded', 'exchange_processing', 'exchange_completed', 'completed',
  'rejected', 'cancelled',
]

export default function AdminReturns() {
  const [returns, setReturns] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const toast = useToast?.()

  useEffect(() => {
    let isCurrent = true
    setLoading(true)
    setError(null)

    fetchReturns({
      page,
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      search: search || undefined,
      per_page: 20,
    })
      .then((res) => {
        if (!isCurrent) return
        setReturns(res.data || [])
        setMeta(res.meta || null)
      })
      .catch((err) => {
        if (!isCurrent) return
        setError(err.message || 'Failed to load returns.')
        toast?.error?.(err.message || 'Failed to load returns.')
      })
      .finally(() => {
        if (isCurrent) setLoading(false)
      })

    return () => {
      isCurrent = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, statusFilter, search])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Returns &amp; Exchanges</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Return #, order #, or customer"
            className="w-72 rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
          />
          <button type="submit" className="rounded-sm border border-ink bg-ink px-3 py-2 text-sm text-white">Search</button>
        </form>

        <select
          value={typeFilter}
          onChange={(e) => { setPage(1); setTypeFilter(e.target.value) }}
          className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t || 'all'} value={t}>{t ? t[0].toUpperCase() + t.slice(1) : 'All types'}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }}
          className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s || 'all'} value={s}>{s ? s.replace(/_/g, ' ') : 'All statuses'}</option>
          ))}
        </select>

        {meta && (
          <span className="ml-auto text-xs text-stone">
            {meta.total} request{meta.total === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {loading && <OrderListSkeleton />}

      {!loading && error && (
        <div className="rounded-sm border border-dashed border-red-300 bg-red-50 p-10 text-center text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && returns.length === 0 && (
        <div className="rounded-sm border border-dashed border-stone-light bg-white p-10 text-center text-sm text-stone">No returns found.</div>
      )}

      {!loading && !error && returns.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-light text-xs uppercase tracking-wide text-stone">
                <th className="px-4 py-3 font-medium">Return #</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((r) => (
                <tr key={r.id} className="border-b border-stone-light last:border-0 hover:bg-bone-dim">
                  <td className="px-4 py-3 font-mono text-xs text-ink">{r.return_number}</td>
                  <td className="px-4 py-3 text-stone">{r.order_number}</td>
                  <td className="px-4 py-3 text-stone">{r.customer?.name ?? '—'}</td>
                  <td className="px-4 py-3 capitalize text-stone">{r.type}</td>
                  <td className="px-4 py-3 text-stone">{r.requested_at ? new Date(r.requested_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-ink">{r.type !== 'exchange' ? formatCurrency(r.refund_amount || 0) : '—'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(r.status)}>{r.status?.replace(/_/g, ' ')}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/returns/${r.id}`} className="font-medium text-ink hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && meta && meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-stone">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-sm border border-stone-light px-3 py-1.5 disabled:opacity-40">
            Previous
          </button>
          <span>Page {meta.current_page} of {meta.last_page}</span>
          <button type="button" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} className="rounded-sm border border-stone-light px-3 py-1.5 disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  )
}
