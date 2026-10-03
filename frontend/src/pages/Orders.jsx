import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import { fetchOrders } from '@/api/orders'
import { useToast } from '@/context/ToastContext'
import { OrderListSkeleton } from '@/components/ui/Skeleton'

function formatCurrency(value) {
  const number = Number(value)
  if (Number.isNaN(number)) return value
  return `৳${number.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
}

function statusTone(status) {
  switch (status) {
    case 'delivered':
      return 'success'
    case 'cancelled':
    case 'returned':
    case 'refunded':
      return 'danger'
    case 'pending':
      return 'neutral'
    default:
      return 'accent'
  }
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const toast = useToast?.()

  useEffect(() => {
    let isCurrent = true
    setLoading(true)
    setError(null)

    fetchOrders({
      page,
      order_status: statusFilter || undefined,
      payment_status: paymentFilter || undefined,
      search: search || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      per_page: 20,
    })
      .then((res) => {
        if (!isCurrent) return
        setOrders(res.data || [])
        setMeta(res.meta || null)
      })
      .catch((err) => {
        if (!isCurrent) return
        setError(err.message || 'Failed to load orders.')
        toast?.error?.(err.message || 'Failed to load orders.')
      })
      .finally(() => {
        if (isCurrent) setLoading(false)
      })

    return () => {
      isCurrent = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, paymentFilter, search, dateFrom, dateTo])

  const statusOptions = [
    '', 'pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled',
  ]
  const paymentOptions = ['', 'pending', 'paid', 'failed', 'refunded']

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Orders</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Order #, customer, phone, or transaction ID"
            className="w-72 rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
          />
          <button type="submit" className="rounded-sm border border-ink bg-ink px-3 py-2 text-sm text-white">Search</button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1)
            setStatusFilter(e.target.value)
          }}
          className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        >
          {statusOptions.map((s) => (
            <option key={s || 'all'} value={s}>
              {s ? s.replace(/_/g, ' ') : 'All statuses'}
            </option>
          ))}
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => {
            setPage(1)
            setPaymentFilter(e.target.value)
          }}
          className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        >
          {paymentOptions.map((s) => (
            <option key={s || 'all'} value={s}>
              {s ? `Payment: ${s}` : 'All payment statuses'}
            </option>
          ))}
        </select>

        <input type="date" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value) }} className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink" />
        <span className="text-xs text-stone">to</span>
        <input type="date" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value) }} className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink" />

        {meta && (
          <span className="ml-auto text-xs text-stone">
            {meta.total} order{meta.total === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {loading && <OrderListSkeleton />}

      {!loading && error && (
        <div className="rounded-sm border border-dashed border-red-300 bg-red-50 p-10 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="rounded-sm border border-dashed border-stone-light bg-white p-10 text-center text-sm text-stone">
          No orders found.
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-light text-xs uppercase tracking-wide text-stone">
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-stone-light last:border-0 hover:bg-bone-dim">
                  <td className="px-4 py-3 font-mono text-xs text-ink">{order.order_number}</td>
                  <td className="px-4 py-3 text-stone">{order.customer?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-stone">
                    {order.order_date ? new Date(order.order_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-ink">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={order.payment_status === 'paid' ? 'success' : 'neutral'}>
                      {order.payment_status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(order.order_status)}>
                      {order.order_status?.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/orders/${order.id}`} className="font-medium text-ink hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && meta && meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-stone">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-sm border border-stone-light px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {meta.current_page} of {meta.last_page}
          </span>
          <button
            type="button"
            disabled={page >= meta.last_page}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-sm border border-stone-light px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
