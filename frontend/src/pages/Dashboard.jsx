import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import Badge from '@/components/ui/Badge'
import { SkeletonStatGrid } from '@/components/ui/Skeleton'
import HealthCheck from '@/components/HealthCheck'
import DateRangeFilter from '@/components/finance/DateRangeFilter'
import KpiCard, { money } from '@/components/finance/KpiCard'
import { fetchAdminDashboard } from '@/api/adminDashboard'
import { useToast } from '@/context/ToastContext'

const ORDER_STATUS_COLORS = {
  pending: '#8c8478',
  confirmed: '#7a2e2e',
  processing: '#c9a24b',
  shipped: '#3a6ea5',
  delivered: '#3a7a4e',
  cancelled: '#b13c3c',
}

const INVENTORY_STATUS_COLORS = {
  in_stock: '#3a7a4e',
  low_stock: '#c9a24b',
  out_of_stock: '#b13c3c',
}

function formatLabel(status) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Quiet stat card — hairline tone bar on top, mono kicker, serif figure. */
function StatCard({ label, value, sub, tone = 'neutral' }) {
  const toneBar = {
    neutral: 'bg-stone',
    accent: 'bg-oxblood',
    success: 'bg-success',
    warning: 'bg-gold',
    danger: 'bg-danger',
  }
  return (
    <div className="relative overflow-hidden rounded-sm border border-stone-light bg-white p-5 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-14px_rgba(22,19,26,0.28)]">
      <span className={`absolute inset-x-0 top-0 h-[3px] ${toneBar[tone]}`} />
      <p className="font-utility text-[10px] uppercase tracking-[0.14em] text-stone">{label}</p>
      <p className="mt-2 font-display text-2xl text-ink">{value}</p>
      {sub && (
        <p className="mt-2">
          <Badge tone={tone} className="normal-case tracking-normal">{sub}</Badge>
        </p>
      )}
    </div>
  )
}

function SectionTitle({ children }) {
  return <h2 className="mb-3 font-display text-lg text-ink">{children}</h2>
}

export default function Dashboard() {
  const toast = useToast?.()
  const [range, setRange] = useState('this_month')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    if (range === 'custom' && (!dateFrom || !dateTo)) return
    setLoading(true)
    setError(null)
    fetchAdminDashboard({ range, date_from: dateFrom || undefined, date_to: dateTo || undefined })
      .then((res) => setData(res.data))
      .catch((err) => {
        setError(err.message || 'Failed to load the dashboard.')
        toast?.error?.(err.message || 'Failed to load the dashboard.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [range, dateFrom, dateTo]) // eslint-disable-line react-hooks/exhaustive-deps

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-utility text-[11px] uppercase tracking-[0.18em] text-oxblood">{today}</p>
          <h1 className="mt-1 font-display text-3xl text-ink">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <HealthCheck />
          <DateRangeFilter
            range={range}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onChange={(v) => { setRange(v.range); setDateFrom(v.dateFrom); setDateTo(v.dateTo) }}
          />
        </div>
      </div>

      {loading && <SkeletonStatGrid count={8} />}

      {!loading && error && (
        <div className="rounded-sm border border-dashed border-danger/40 bg-danger/5 p-10 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Sales — fixed presets */}
          <SectionTitle>Sales</SectionTitle>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Today" value={money(data.sales.today)} tone="accent" />
            <StatCard label="Yesterday" value={money(data.sales.yesterday)} />
            <StatCard label="Last 7 Days" value={money(data.sales.last_7_days)} />
            <StatCard label="Last 30 Days" value={money(data.sales.last_30_days)} />
            <StatCard label="This Month" value={money(data.sales.this_month)} />
            <StatCard label="This Year" value={money(data.sales.this_year)} />
          </div>

          {/* Orders */}
          <SectionTitle>Orders</SectionTitle>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
            <StatCard label="Total" value={data.orders.total.toLocaleString()} tone="accent" />
            <StatCard label="Pending" value={data.orders.pending.toLocaleString()} />
            <StatCard label="Confirmed" value={data.orders.confirmed.toLocaleString()} />
            <StatCard label="Processing" value={data.orders.processing.toLocaleString()} tone="warning" />
            <StatCard label="Shipped" value={data.orders.shipped.toLocaleString()} />
            <StatCard label="Delivered" value={data.orders.delivered.toLocaleString()} tone="success" />
            <StatCard label="Cancelled" value={data.orders.cancelled.toLocaleString()} tone="danger" />
          </div>

          {/* Customers / Products / Inventory */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div>
              <SectionTitle>Customers</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Total" value={data.customers.total.toLocaleString()} />
                <StatCard label="New" value={data.customers.new.toLocaleString()} tone="accent" />
                <StatCard label="Active" value={data.customers.active.toLocaleString()} tone="success" />
              </div>
            </div>
            <div>
              <SectionTitle>Products</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Total" value={data.products.total.toLocaleString()} />
                <StatCard label="Active" value={data.products.active.toLocaleString()} tone="success" />
                <StatCard label="Featured" value={data.products.featured.toLocaleString()} tone="accent" />
                <StatCard label="Best Selling" value={data.products.best_selling.toLocaleString()} />
              </div>
            </div>
            <div>
              <SectionTitle>Inventory</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Total Stock" value={data.inventory.total_stock.toLocaleString()} />
                <StatCard label="Value" value={money(data.inventory.inventory_value)} />
                <StatCard label="Low Stock" value={data.inventory.low_stock.toLocaleString()} tone="warning" />
                <StatCard label="Out of Stock" value={data.inventory.out_of_stock.toLocaleString()} tone="danger" />
              </div>
            </div>
          </div>

          {/* Finance */}
          <SectionTitle>Finance</SectionTitle>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Gross Sales" value={money(data.finance.gross_sales)} />
            <StatCard label="Discounts" value={money(data.finance.discounts)} tone="warning" />
            <StatCard label="Refunds" value={money(data.finance.refunds)} tone="danger" />
            <StatCard label="Net Sales" value={money(data.finance.net_sales)} tone="accent" />
            <StatCard label="COGS" value={money(data.finance.cogs)} />
            <StatCard label="Gross Profit" value={money(data.finance.gross_profit)} tone="success" />
            <StatCard label="Operating Expenses" value={money(data.finance.operating_expenses)} tone="warning" />
            <StatCard
              label="Net Profit"
              value={money(data.finance.net_profit)}
              tone={data.finance.net_profit >= 0 ? 'success' : 'danger'}
              sub={`Margin ${data.finance.profit_margin}%`}
            />
          </div>

          {/* Charts */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-sm border border-stone-light bg-white p-4">
              <h3 className="mb-3 font-display text-base text-ink">Sales Trend</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.charts.sales_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => money(v)} />
                  <Line type="monotone" dataKey="value" stroke="#7a2e2e" name="Sales" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-sm border border-stone-light bg-white p-4">
              <h3 className="mb-3 font-display text-base text-ink">Revenue vs Expense</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.charts.revenue_vs_expense}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => money(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#7a2e2e" name="Revenue" strokeWidth={2} />
                  <Line type="monotone" dataKey="expense" stroke="#c9a24b" name="Expense" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-sm border border-stone-light bg-white p-4">
              <h3 className="mb-3 font-display text-base text-ink">Profit Trend</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.charts.profit_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => money(v)} />
                  <Line type="monotone" dataKey="value" stroke="#3a7a4e" name="Net Profit" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-sm border border-stone-light bg-white p-4">
              <h3 className="mb-3 font-display text-base text-ink">Order Status</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={data.charts.order_status}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {data.charts.order_status.map((entry) => (
                      <Cell key={entry.status} fill={ORDER_STATUS_COLORS[entry.status] || '#8c8478'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n, p) => [v, formatLabel(p.payload.status)]} />
                  <Legend formatter={(v) => formatLabel(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-sm border border-stone-light bg-white p-4">
              <h3 className="mb-3 font-display text-base text-ink">Top Products</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.charts.top_products} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip />
                  <Bar dataKey="units_sold" fill="#7a2e2e" name="Units Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-sm border border-stone-light bg-white p-4">
              <h3 className="mb-3 font-display text-base text-ink">Top Categories</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.charts.top_categories} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip formatter={(v) => money(v)} />
                  <Bar dataKey="revenue" fill="#c9a24b" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-sm border border-stone-light bg-white p-4 lg:col-span-2">
              <h3 className="mb-3 font-display text-base text-ink">Inventory Status</h3>
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <ResponsiveContainer width="100%" height={200} className="sm:max-w-xs">
                  <PieChart>
                    <Pie
                      data={data.charts.inventory_status}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {data.charts.inventory_status.map((entry) => (
                        <Cell key={entry.status} fill={INVENTORY_STATUS_COLORS[entry.status] || '#8c8478'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n, p) => [v, formatLabel(p.payload.status)]} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="flex flex-1 flex-col gap-2 text-sm">
                  {data.charts.inventory_status.map((row) => (
                    <li key={row.status} className="flex items-center justify-between border-b border-stone-light pb-2">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: INVENTORY_STATUS_COLORS[row.status] }} />
                        {formatLabel(row.status)}
                      </span>
                      <span className="font-display text-ink">{row.count.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Recent transactions rail */}
          <div className="rounded-sm border border-stone-light bg-white">
            <div className="flex items-center justify-between border-b border-stone-light px-5 py-3">
              <h2 className="font-display text-base text-ink">Recent Transactions</h2>
              <Link to="/admin/finance" className="text-xs text-oxblood hover:underline">View finance</Link>
            </div>
            {(!data.recent_transactions || data.recent_transactions.length === 0) ? (
              <p className="px-5 py-6 text-sm text-stone">No transactions yet.</p>
            ) : (
              <ul className="divide-y divide-stone-light">
                {data.recent_transactions.map((txn) => (
                  <li key={txn.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div>
                      <p className="font-mono text-xs text-ink">{txn.transaction_number}</p>
                      <p className="text-stone">{txn.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-display ${txn.direction === 'income' ? 'text-success' : 'text-danger'}`}>
                        {txn.direction === 'income' ? '+' : '-'}{money(txn.amount)}
                      </p>
                      <Badge tone={txn.direction === 'income' ? 'success' : 'danger'} className="mt-1 normal-case tracking-normal">
                        {txn.type}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
