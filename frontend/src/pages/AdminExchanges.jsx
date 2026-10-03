import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { fetchExchanges, updateExchangeStatus } from '@/api/returns'
import { useToast } from '@/context/ToastContext'
import { OrderListSkeleton } from '@/components/ui/Skeleton'

const NEXT_ACTION = {
  pending: { value: 'approved', label: 'Approve' },
  approved: { value: 'processing', label: 'Start Processing' },
  processing: { value: 'shipped', label: 'Mark Shipped' },
  shipped: { value: 'completed', label: 'Mark Completed' },
}

function statusTone(status) {
  if (status === 'completed') return 'success'
  if (status === 'cancelled') return 'danger'
  if (status === 'pending') return 'neutral'
  return 'accent'
}

export default function AdminExchanges() {
  const toast = useToast()
  const [exchanges, setExchanges] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    fetchExchanges({ page, status: statusFilter || undefined, per_page: 20 })
      .then((res) => {
        setExchanges(res.data || [])
        setMeta(res.meta || null)
      })
      .catch((err) => toast.error(err.message || 'Failed to load exchanges.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [page, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const advance = async (exchange, status) => {
    setBusyId(exchange.id)
    try {
      await updateExchangeStatus(exchange.id, status)
      toast.success('Exchange status updated.')
      load()
    } catch (err) {
      toast.error(err.message || 'Could not update exchange.')
    } finally {
      setBusyId(null)
    }
  }

  const STATUS_OPTIONS = ['', 'pending', 'approved', 'processing', 'shipped', 'completed', 'cancelled']

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Exchanges</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }}
          className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        >
          {STATUS_OPTIONS.map((s) => <option key={s || 'all'} value={s}>{s ? s : 'All statuses'}</option>)}
        </select>
        {meta && <span className="ml-auto text-xs text-stone">{meta.total} exchange{meta.total === 1 ? '' : 's'}</span>}
      </div>

      {loading && <OrderListSkeleton />}

      {!loading && exchanges.length === 0 && (
        <div className="rounded-sm border border-dashed border-stone-light bg-white p-10 text-center text-sm text-stone">No exchanges found.</div>
      )}

      {!loading && exchanges.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-light text-xs uppercase tracking-wide text-stone">
                <th className="px-4 py-3 font-medium">Return #</th>
                <th className="px-4 py-3 font-medium">Original</th>
                <th className="px-4 py-3 font-medium">Replacement</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Price Diff.</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exchanges.map((ex) => {
                const next = NEXT_ACTION[ex.status]
                return (
                  <tr key={ex.id} className="border-b border-stone-light last:border-0 hover:bg-bone-dim">
                    <td className="px-4 py-3">
                      <Link to={`/admin/returns/${ex.return_id}`} className="font-mono text-xs text-ink hover:underline">View return</Link>
                    </td>
                    <td className="px-4 py-3 text-stone">{[ex.original_variant?.color, ex.original_variant?.size].filter(Boolean).join(' / ') || '—'}</td>
                    <td className="px-4 py-3 text-stone">{[ex.replacement_variant?.color, ex.replacement_variant?.size].filter(Boolean).join(' / ') || '—'}</td>
                    <td className="px-4 py-3 text-ink">{ex.quantity}</td>
                    <td className="px-4 py-3 text-ink">{ex.price_difference > 0 ? `৳${Number(ex.price_difference).toLocaleString()} (${ex.price_difference_action?.replace(/_/g, ' ')})` : '—'}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(ex.status)}>{ex.status}</Badge></td>
                    <td className="px-4 py-3">
                      {next && (
                        <Button size="sm" onClick={() => advance(ex, next.value)} loading={busyId === ex.id}>{next.label}</Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && meta && meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-stone">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-sm border border-stone-light px-3 py-1.5 disabled:opacity-40">Previous</button>
          <span>Page {meta.current_page} of {meta.last_page}</span>
          <button type="button" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} className="rounded-sm border border-stone-light px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}
