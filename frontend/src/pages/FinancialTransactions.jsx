import { useEffect, useState } from 'react'
import Badge from '@/components/ui/Badge'
import { money } from '@/components/finance/KpiCard'
import { fetchTransactions } from '@/api/financeService'
import { useToast } from '@/context/ToastContext'
import { OrderListSkeleton } from '@/components/ui/Skeleton'

const TXN_TONE = { sale: 'success', refund: 'danger', expense: 'warning', purchase: 'accent', adjustment: 'neutral' }
const TYPE_OPTIONS = ['', 'sale', 'refund', 'expense', 'purchase', 'adjustment']
const DIRECTION_OPTIONS = ['', 'income', 'expense']

export default function FinancialTransactions() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [type, setType] = useState('')
  const [direction, setDirection] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetchTransactions({ page, per_page: 25, type: type || undefined, direction: direction || undefined })
      .then((res) => { setRows(res.data.data || []); setMeta(res.data.meta || null) })
      .catch((err) => toast.error(err.message || 'Failed to load transactions.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [page, type, direction]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Financial Transactions</h1>
        <div className="flex gap-3">
          <select value={type} onChange={(e) => { setPage(1); setType(e.target.value) }} className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink">
            {TYPE_OPTIONS.map((t) => <option key={t || 'all'} value={t}>{t || 'All types'}</option>)}
          </select>
          <select value={direction} onChange={(e) => { setPage(1); setDirection(e.target.value) }} className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink">
            {DIRECTION_OPTIONS.map((d) => <option key={d || 'all'} value={d}>{d || 'All directions'}</option>)}
          </select>
        </div>
      </div>

      {loading && <OrderListSkeleton />}

      {!loading && rows.length === 0 && (
        <div className="rounded-sm border border-dashed border-stone-light bg-white p-10 text-center text-sm text-stone">No transactions found.</div>
      )}

      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-light text-xs uppercase tracking-wide text-stone">
                <th className="px-4 py-3 font-medium">Transaction</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Income</th>
                <th className="px-4 py-3 font-medium">Expense</th>
                <th className="px-4 py-3 font-medium">Method</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-stone-light last:border-0 hover:bg-bone-dim">
                  <td className="px-4 py-3 font-mono text-xs text-ink">{t.transaction_number}</td>
                  <td className="px-4 py-3 text-stone">{t.transaction_date}</td>
                  <td className="px-4 py-3"><Badge tone={TXN_TONE[t.type] || 'neutral'}>{t.type}</Badge></td>
                  <td className="px-4 py-3 text-stone">{t.description}</td>
                  <td className="px-4 py-3 font-medium text-success">{t.direction === 'income' ? money(t.amount) : ''}</td>
                  <td className="px-4 py-3 font-medium text-danger">{t.direction === 'expense' ? money(t.amount) : ''}</td>
                  <td className="px-4 py-3 uppercase text-stone">{t.payment_method || '—'}</td>
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
