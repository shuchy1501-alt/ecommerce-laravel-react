import { useEffect, useState } from 'react'
import DateRangeFilter from '@/components/finance/DateRangeFilter'
import { money } from '@/components/finance/KpiCard'
import { fetchProfitLoss } from '@/api/financeService'
import { useToast } from '@/context/ToastContext'

function Row({ label, value, bold, indent, negative }) {
  return (
    <div className={`flex items-center justify-between py-2 ${bold ? 'border-t border-stone-light font-medium text-ink' : 'text-stone'} ${indent ? 'pl-4' : ''}`}>
      <span>{label}</span>
      <span className={bold ? 'text-ink' : negative ? 'text-danger' : 'text-ink'}>{negative ? `(${money(value)})` : money(value)}</span>
    </div>
  )
}

export default function ProfitLoss() {
  const toast = useToast()
  const [range, setRange] = useState('this_month')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (range === 'custom' && (!dateFrom || !dateTo)) return
    setLoading(true)
    fetchProfitLoss({ range, date_from: dateFrom || undefined, date_to: dateTo || undefined })
      .then((res) => setReport(res.data))
      .catch((err) => toast.error(err.message || 'Failed to load the P&L report.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [range, dateFrom, dateTo]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Profit &amp; Loss</h1>
        <DateRangeFilter range={range} dateFrom={dateFrom} dateTo={dateTo} onChange={(v) => { setRange(v.range); setDateFrom(v.dateFrom); setDateTo(v.dateTo) }} />
      </div>

      {loading && <div className="rounded-sm border border-stone-light bg-white p-10 text-center text-sm text-stone">Loading…</div>}

      {!loading && report && (
        <div className="mx-auto max-w-xl rounded-sm border border-stone-light bg-white p-6">
          <p className="mb-4 text-xs text-stone">{report.range.from} to {report.range.to}</p>

          <h2 className="mb-1 font-utility text-xs uppercase tracking-wider text-stone">Revenue</h2>
          <Row label="Gross Sales" value={report.grossSales} indent />
          <Row label="− Discounts" value={report.discounts} indent negative />
          <Row label="− Refunds" value={report.refunds} indent negative />
          <Row label="= Net Sales" value={report.netSales} bold />

          <div className="h-4" />
          <Row label="− Cost of Goods Sold" value={report.cogs} negative />
          <Row label="= Gross Profit" value={report.grossProfit} bold />

          <div className="h-4" />
          <Row label="− Operating Expenses" value={report.expenses} negative />
          <Row label="= Net Profit" value={report.netProfit} bold />

          <div className={`mt-4 rounded-sm px-4 py-3 text-center text-sm font-medium ${report.netProfit >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
            Profit Margin: {report.margin}%
          </div>

          {report.expense_breakdown?.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 font-utility text-xs uppercase tracking-wider text-stone">Expense Breakdown</h2>
              {report.expense_breakdown.map((row) => (
                <div key={row.category} className="flex justify-between py-1 text-sm text-stone">
                  <span>{row.category} ({row.percentage}%)</span>
                  <span className="text-ink">{money(row.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
