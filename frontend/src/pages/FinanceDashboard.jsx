import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import KpiCard, { money } from '@/components/finance/KpiCard'
import DateRangeFilter from '@/components/finance/DateRangeFilter'
import Badge from '@/components/ui/Badge'
import { fetchDashboard } from '@/api/financeService'
import { useToast } from '@/context/ToastContext'

const TXN_TONE = { sale: 'success', refund: 'danger', expense: 'warning', purchase: 'accent', adjustment: 'neutral' }

export default function FinanceDashboard() {
  const toast = useToast()
  const [range, setRange] = useState('this_month')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (range === 'custom' && (!dateFrom || !dateTo)) return
    setLoading(true)
    fetchDashboard({ range, date_from: dateFrom || undefined, date_to: dateTo || undefined })
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err.message || 'Failed to load the financial dashboard.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [range, dateFrom, dateTo]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Financial Dashboard</h1>
        <DateRangeFilter range={range} dateFrom={dateFrom} dateTo={dateTo} onChange={(v) => { setRange(v.range); setDateFrom(v.dateFrom); setDateTo(v.dateTo) }} />
      </div>

      {loading && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-sm bg-bone-dim" />)}
        </div>
      )}

      {!loading && data && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard label="Today's Revenue" value={money(data.cards.today_revenue)} />
            <KpiCard label="This Month Revenue" value={money(data.cards.this_month_revenue)} />
            <KpiCard label="This Month Expenses" value={money(data.cards.this_month_expenses)} toneClass="text-danger" />
            <KpiCard label="This Month Profit" value={money(data.cards.this_month_profit)} toneClass={data.cards.this_month_profit >= 0 ? 'text-success' : 'text-danger'} />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard label="Total Revenue" value={money(data.summary.total_revenue)} />
            <KpiCard label="Net Sales" value={money(data.summary.net_sales)} />
            <KpiCard label="Gross Profit" value={money(data.summary.gross_profit)} />
            <KpiCard
              label="Net Profit"
              value={money(data.summary.net_profit)}
              toneClass={data.summary.net_profit >= 0 ? 'text-success' : 'text-danger'}
              sub={`Margin ${data.summary.profit_margin}%`}
            />
            <KpiCard label="Total Refunds" value={money(data.summary.total_refunds)} toneClass="text-danger" />
            <KpiCard label="Total Purchase Cost" value={money(data.summary.total_purchase_cost)} />
            <KpiCard label="Total Expenses" value={money(data.summary.total_expenses)} toneClass="text-danger" />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-sm border border-stone-light bg-white p-4">
              <h2 className="mb-3 font-display text-base text-ink">Revenue vs Expenses vs Profit</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={mergeTrends(data)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => money(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#7a2e2e" name="Revenue" strokeWidth={2} />
                  <Line type="monotone" dataKey="expense" stroke="#c9a24b" name="Expense" strokeWidth={2} />
                  <Line type="monotone" dataKey="profit" stroke="#3a7a4e" name="Profit" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-sm border border-stone-light bg-white p-4">
              <h2 className="mb-3 font-display text-base text-ink">Expense Breakdown</h2>
              {data.expense_breakdown.length === 0 ? (
                <p className="py-10 text-center text-sm text-stone">No paid expenses in this range.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.expense_breakdown} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="category" type="category" width={90} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => money(v)} />
                    <Bar dataKey="amount" fill="#7a2e2e" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-sm border border-stone-light bg-white">
            <div className="flex items-center justify-between border-b border-stone-light px-4 py-3">
              <h2 className="font-display text-base text-ink">Recent Transactions</h2>
              <Link to="/admin/finance/transactions" className="text-xs font-medium text-oxblood hover:underline">View all</Link>
            </div>
            <ul className="divide-y divide-stone-light">
              {data.recent_transactions.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-stone">No transactions recorded yet.</li>
              )}
              {data.recent_transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-mono text-xs text-ink">{t.transaction_number}</p>
                    <p className="text-xs text-stone">{t.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={TXN_TONE[t.type] || 'neutral'}>{t.type}</Badge>
                    <span className={t.direction === 'income' ? 'text-success' : 'text-danger'}>
                      {t.direction === 'income' ? '+' : '-'}{money(t.amount)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

function mergeTrends(data) {
  return data.revenue_trend.map((r, i) => ({
    label: r.label,
    revenue: r.value,
    expense: data.expense_trend[i]?.value ?? 0,
    profit: data.profit_trend[i]?.value ?? 0,
  }))
}
