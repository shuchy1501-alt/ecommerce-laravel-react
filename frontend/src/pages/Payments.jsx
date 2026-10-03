import { useEffect, useState } from 'react'
import Badge from '@/components/ui/Badge'
import { money } from '@/components/finance/KpiCard'
import { fetchFinancePayments } from '@/api/financeService'
import { useToast } from '@/context/ToastContext'
import { OrderListSkeleton } from '@/components/ui/Skeleton'

function statusTone(status) {
  if (status === 'paid') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'refunded' || status === 'partially_refunded') return 'accent'
  return 'neutral'
}

const STATUS_OPTIONS = ['', 'pending', 'paid', 'failed', 'refunded', 'partially_refunded']

export default function Payments() {
  const toast = useToast()
  const [payments, setPayments] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetchFinancePayments({ page, per_page: 20, status: status || undefined })
      .then((res) => { setPayments(res.data.data || []); setMeta(res.data.meta || null) })
      .catch((err) => toast.error(err.message || 'Failed to load payments.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [page, status]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Payments</h1>
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }} className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink">
          {STATUS_OPTIONS.map((s) => <option key={s || 'all'} value={s}>{s ? s.replace('_', ' ') : 'All statuses'}</option>)}
        </select>
      </div>

      {loading && <OrderListSkeleton />}

      {!loading && payments.length === 0 && (
        <div className="rounded-sm border border-dashed border-stone-light bg-white p-10 text-center text-sm text-stone">No payments found.</div>
      )}

      {!loading && payments.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-light text-xs uppercase tracking-wide text-stone">
                <th className="px-4 py-3 font-medium">Payment #</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Transaction ID</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-stone-light last:border-0 hover:bg-bone-dim">
                  <td className="px-4 py-3 text-ink">#{p.id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink">{p.order_number}</td>
                  <td className="px-4 py-3 uppercase text-stone">{p.payment_method}</td>
                  <td className="px-4 py-3 font-medium text-ink">{money(p.amount)}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(p.status)}>{p.status?.replace('_', ' ')}</Badge></td>
                  <td className="px-4 py-3 font-mono text-xs text-stone">{p.transaction_id || '—'}</td>
                  <td className="px-4 py-3 text-stone">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
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
