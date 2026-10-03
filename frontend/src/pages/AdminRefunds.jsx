import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { fetchRefunds, processRefund } from '@/api/returns'
import { useToast } from '@/context/ToastContext'
import { OrderListSkeleton } from '@/components/ui/Skeleton'

function formatCurrency(value) {
  return `৳${Number(value || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
}

function statusTone(status) {
  if (status === 'completed') return 'success'
  if (status === 'failed' || status === 'cancelled') return 'danger'
  if (status === 'pending') return 'neutral'
  return 'accent'
}

const STATUS_OPTIONS = ['', 'pending', 'processing', 'completed', 'failed', 'cancelled']

export default function AdminRefunds() {
  const toast = useToast()
  const [refunds, setRefunds] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    fetchRefunds({ page, status: statusFilter || undefined, search: search || undefined, per_page: 20 })
      .then((res) => {
        setRefunds(res.data || [])
        setMeta(res.meta || null)
      })
      .catch((err) => toast.error(err.message || 'Failed to load refunds.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [page, statusFilter, search]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleProcess = async (refund) => {
    setBusyId(refund.id)
    try {
      await processRefund(refund.id)
      toast.success('Refund processed.')
      load()
    } catch (err) {
      toast.error(err.message || 'Could not process this refund.')
    } finally {
      setBusyId(null)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Refunds</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Refund # or order #"
            className="w-64 rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
          />
          <button type="submit" className="rounded-sm border border-ink bg-ink px-3 py-2 text-sm text-white">Search</button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }}
          className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        >
          {STATUS_OPTIONS.map((s) => <option key={s || 'all'} value={s}>{s || 'All statuses'}</option>)}
        </select>

        {meta && <span className="ml-auto text-xs text-stone">{meta.total} refund{meta.total === 1 ? '' : 's'}</span>}
      </div>

      {loading && <OrderListSkeleton />}

      {!loading && refunds.length === 0 && (
        <div className="rounded-sm border border-dashed border-stone-light bg-white p-10 text-center text-sm text-stone">No refunds found.</div>
      )}

      {!loading && refunds.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-light text-xs uppercase tracking-wide text-stone">
                <th className="px-4 py-3 font-medium">Refund #</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((refund) => (
                <tr key={refund.id} className="border-b border-stone-light last:border-0 hover:bg-bone-dim">
                  <td className="px-4 py-3 font-mono text-xs text-ink">{refund.refund_number}</td>
                  <td className="px-4 py-3 text-stone">
                    {refund.order_number}
                    {refund.return_id && (
                      <Link to={`/admin/returns/${refund.return_id}`} className="ml-2 text-xs text-oxblood hover:underline">(return)</Link>
                    )}
                  </td>
                  <td className="px-4 py-3 uppercase text-stone">{refund.refund_method}</td>
                  <td className="px-4 py-3 text-ink">{formatCurrency(refund.amount)}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(refund.status)}>{refund.status}</Badge></td>
                  <td className="px-4 py-3 text-stone">{refund.created_at ? new Date(refund.created_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    {refund.status === 'pending' && (
                      <Button size="sm" onClick={() => handleProcess(refund)} loading={busyId === refund.id}>Process</Button>
                    )}
                  </td>
                </tr>
              ))}
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
