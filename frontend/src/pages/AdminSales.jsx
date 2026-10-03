import { useEffect, useState } from 'react'
import { fetchSalesSummary } from '@/api/orders'
import { useToast } from '@/context/ToastContext'

function formatCurrency(value) {
  return `৳${Number(value || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
}

const CARDS = [
  { key: 'today_sales', label: "Today's Sales", money: true },
  { key: 'this_week_sales', label: 'This Week', money: true },
  { key: 'this_month_sales', label: 'This Month', money: true },
  { key: 'total_revenue', label: 'Total Revenue', money: true },
  { key: 'total_orders', label: 'Total Orders', money: false },
  { key: 'paid_orders', label: 'Paid Orders', money: false },
  { key: 'pending_orders', label: 'Pending Orders', money: false },
  { key: 'cancelled_orders', label: 'Cancelled Orders', money: false },
]

export default function AdminSales() {
  const toast = useToast()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSalesSummary()
      .then((res) => setSummary(res.data))
      .catch((err) => toast.error(err.message || 'Could not load sales summary.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-ink">Sales</h1>

      {loading ? (
        <div className="rounded-sm border border-stone-light bg-white p-10 text-center text-sm text-stone">Loading sales summary…</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CARDS.map((c) => (
            <div key={c.key} className="rounded-sm border border-stone-light bg-white p-5">
              <p className="text-xs uppercase tracking-wide text-stone">{c.label}</p>
              <p className="mt-2 font-display text-2xl text-ink">
                {c.money ? formatCurrency(summary?.[c.key]) : (summary?.[c.key] ?? 0)}
              </p>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="mt-6 rounded-sm border border-stone-light bg-white p-5 text-sm">
          <h2 className="mb-3 font-medium text-ink">Breakdown</h2>
          <div className="space-y-1.5 text-stone">
            <div className="flex justify-between"><span>Total Discount Given</span><span className="text-ink">{formatCurrency(summary?.total_discount)}</span></div>
            <div className="flex justify-between"><span>Total Shipping Collected</span><span className="text-ink">{formatCurrency(summary?.total_shipping)}</span></div>
            <div className="flex justify-between"><span>Total Tax Collected</span><span className="text-ink">{formatCurrency(summary?.total_tax)}</span></div>
          </div>
          <p className="mt-4 text-xs text-stone">Profit and cost-of-goods reporting will be added in a later phase.</p>
        </div>
      )}
    </div>
  )
}
