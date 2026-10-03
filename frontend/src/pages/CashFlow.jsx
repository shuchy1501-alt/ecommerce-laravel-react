import { useEffect, useState } from 'react'
import DateRangeFilter from '@/components/finance/DateRangeFilter'
import { money } from '@/components/finance/KpiCard'
import { fetchCashFlow } from '@/api/financeService'
import { useToast } from '@/context/ToastContext'

export default function CashFlow() {
  const toast = useToast()
  const [range, setRange] = useState('this_month')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (range === 'custom' && (!dateFrom || !dateTo)) return
    setLoading(true)
    fetchCashFlow({ range, date_from: dateFrom || undefined, date_to: dateTo || undefined })
      .then((res) => setReport(res.data))
      .catch((err) => toast.error(err.message || 'Failed to load cash flow.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [range, dateFrom, dateTo]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Cash Flow</h1>
        <DateRangeFilter range={range} dateFrom={dateFrom} dateTo={dateTo} onChange={(v) => { setRange(v.range); setDateFrom(v.dateFrom); setDateTo(v.dateTo) }} />
      </div>

      {loading && <div className="rounded-sm border border-stone-light bg-white p-10 text-center text-sm text-stone">Loading…</div>}

      {!loading && report && (
        <>
          <p className="mb-4 text-xs text-stone">
            {report.range.from} to {report.range.to} — cash flow reflects money actually received/paid, which is not the same as profit (inventory purchases are full cash-out here, but only become an expense gradually as goods are sold).
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-sm border border-stone-light bg-white p-5">
              <h2 className="mb-3 font-display text-base text-success">Cash In</h2>
              <div className="flex justify-between py-1 text-sm"><span className="text-stone">Sales Payments</span><span className="text-ink">{money(report.cash_in.sales_payments)}</span></div>
              <div className="flex justify-between py-1 text-sm"><span className="text-stone">Other Income</span><span className="text-ink">{money(report.cash_in.other_income)}</span></div>
              <div className="mt-2 flex justify-between border-t border-stone-light pt-2 text-sm font-medium"><span className="text-ink">Total</span><span className="text-success">{money(report.cash_in.total)}</span></div>
            </div>

            <div className="rounded-sm border border-stone-light bg-white p-5">
              <h2 className="mb-3 font-display text-base text-danger">Cash Out</h2>
              <div className="flex justify-between py-1 text-sm"><span className="text-stone">Refunds</span><span className="text-ink">{money(report.cash_out.refunds)}</span></div>
              <div className="flex justify-between py-1 text-sm"><span className="text-stone">Expenses</span><span className="text-ink">{money(report.cash_out.expenses)}</span></div>
              <div className="flex justify-between py-1 text-sm"><span className="text-stone">Inventory Purchases</span><span className="text-ink">{money(report.cash_out.inventory_purchases)}</span></div>
              <div className="mt-2 flex justify-between border-t border-stone-light pt-2 text-sm font-medium"><span className="text-ink">Total</span><span className="text-danger">{money(report.cash_out.total)}</span></div>
            </div>
          </div>

          <div className={`mt-6 rounded-sm px-6 py-5 text-center ${report.net_cash_flow >= 0 ? 'bg-success/10' : 'bg-danger/10'}`}>
            <p className="text-xs uppercase tracking-wider text-stone">Net Cash Flow</p>
            <p className={`mt-1 font-display text-3xl ${report.net_cash_flow >= 0 ? 'text-success' : 'text-danger'}`}>{money(report.net_cash_flow)}</p>
          </div>
        </>
      )}
    </div>
  )
}
