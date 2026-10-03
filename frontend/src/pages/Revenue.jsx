import { useEffect, useState } from 'react'
import Badge from '@/components/ui/Badge'
import DateRangeFilter from '@/components/finance/DateRangeFilter'
import { money } from '@/components/finance/KpiCard'
import { fetchRevenue } from '@/api/financeService'
import { useToast } from '@/context/ToastContext'
import { OrderListSkeleton } from '@/components/ui/Skeleton'

function presetToDates(range, dateFrom, dateTo) {
  // Revenue endpoint takes raw date_from/date_to (spec section 16), so
  // resolve non-custom presets on the client the same way the backend would.
  const today = new Date()
  const iso = (d) => d.toISOString().slice(0, 10)
  const start = new Date(today)

  switch (range) {
    case 'today': return [iso(today), iso(today)]
    case 'yesterday': { const y = new Date(today); y.setDate(y.getDate() - 1); return [iso(y), iso(y)] }
    case 'last_7_days': { start.setDate(start.getDate() - 6); return [iso(start), iso(today)] }
    case 'last_30_days': { start.setDate(start.getDate() - 29); return [iso(start), iso(today)] }
    case 'this_month': { const s = new Date(today.getFullYear(), today.getMonth(), 1); return [iso(s), iso(today)] }
    case 'last_month': { const s = new Date(today.getFullYear(), today.getMonth() - 1, 1); const e = new Date(today.getFullYear(), today.getMonth(), 0); return [iso(s), iso(e)] }
    case 'this_year': { const s = new Date(today.getFullYear(), 0, 1); return [iso(s), iso(today)] }
    case 'custom': return [dateFrom, dateTo]
    default: return [undefined, undefined]
  }
}

export default function Revenue() {
  const toast = useToast()
  const [range, setRange] = useState('this_month')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = () => {
    const [from, to] = presetToDates(range, dateFrom, dateTo)
    if (range === 'custom' && (!from || !to)) return
    setLoading(true)
    fetchRevenue({ date_from: from, date_to: to, page, per_page: 20 })
      .then((res) => { setRows(res.data.data || []); setMeta(res.data.meta || null) })
      .catch((err) => toast.error(err.message || 'Failed to load revenue.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [range, dateFrom, dateTo, page]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Revenue</h1>
        <DateRangeFilter range={range} dateFrom={dateFrom} dateTo={dateTo} onChange={(v) => { setPage(1); setRange(v.range); setDateFrom(v.dateFrom); setDateTo(v.dateTo) }} />
      </div>

      {loading && <OrderListSkeleton />}

      {!loading && rows.length === 0 && (
        <div className="rounded-sm border border-dashed border-stone-light bg-white p-10 text-center text-sm text-stone">No revenue recorded in this range.</div>
      )}

      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-light text-xs uppercase tracking-wide text-stone">
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Subtotal</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Shipping</th>
                <th className="px-4 py-3 font-medium">Tax</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-stone-light last:border-0 hover:bg-bone-dim">
                  <td className="px-4 py-3 font-mono text-xs text-ink">{r.order_number}</td>
                  <td className="px-4 py-3 text-stone">{r.customer || '—'}</td>
                  <td className="px-4 py-3 text-stone">{r.date}</td>
                  <td className="px-4 py-3 text-stone">{money(r.subtotal)}</td>
                  <td className="px-4 py-3 text-stone">{money(r.discount)}</td>
                  <td className="px-4 py-3 text-stone">{money(r.shipping)}</td>
                  <td className="px-4 py-3 text-stone">{money(r.tax)}</td>
                  <td className="px-4 py-3 font-medium text-ink">{money(r.total)}</td>
                  <td className="px-4 py-3 capitalize">
                    <Badge tone={r.order_status === 'delivered' ? 'success' : r.order_status === 'cancelled' ? 'danger' : 'neutral'}>{r.order_status}</Badge>
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
