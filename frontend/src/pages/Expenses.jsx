import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import KpiCard, { money } from '@/components/finance/KpiCard'
import { fetchExpenses, fetchExpenseCategories, markExpensePaid, cancelExpense } from '@/api/expenseService'
import { useToast } from '@/context/ToastContext'
import { OrderListSkeleton } from '@/components/ui/Skeleton'

function statusTone(status) {
  if (status === 'paid') return 'success'
  if (status === 'cancelled') return 'danger'
  return 'neutral'
}

const STATUS_OPTIONS = ['', 'pending', 'paid', 'cancelled']
const METHOD_OPTIONS = ['', 'cash', 'bank', 'card', 'mobile_banking', 'other']

export default function Expenses() {
  const toast = useToast()
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    fetchExpenseCategories().then((res) => setCategories(res.data || [])).catch(() => {})
  }, [])

  const load = () => {
    setLoading(true)
    fetchExpenses({
      page, per_page: 20,
      category_id: categoryId || undefined,
      status: status || undefined,
      payment_method: method || undefined,
      search: search || undefined,
    })
      .then((res) => {
        setExpenses(res.data.data || [])
        setMeta(res.data.meta || null)
        setSummary(res.data.summary || null)
      })
      .catch((err) => toast.error(err.message || 'Failed to load expenses.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [page, categoryId, status, method, search]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const handleMarkPaid = async (expense) => {
    setBusyId(expense.id)
    try {
      await markExpensePaid(expense.id)
      toast.success('Expense marked as paid.')
      load()
    } catch (err) {
      toast.error(err.message || 'Could not mark this expense as paid.')
    } finally {
      setBusyId(null)
    }
  }

  const handleCancel = async (expense) => {
    setBusyId(expense.id)
    try {
      await cancelExpense(expense.id)
      toast.success('Expense cancelled.')
      load()
    } catch (err) {
      toast.error(err.message || 'Could not cancel this expense.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Expenses</h1>
        <div className="flex gap-2">
          <Link to="/admin/finance/expense-categories" className="rounded-sm border border-stone-light px-3 py-2 text-sm text-ink hover:bg-bone-dim">Categories</Link>
          <Link to="/admin/finance/expenses/new"><Button size="sm">+ New Expense</Button></Link>
        </div>
      </div>

      {summary && (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Total" value={money(summary.total)} />
          <KpiCard label="Paid" value={money(summary.paid)} toneClass="text-success" />
          <KpiCard label="Pending" value={money(summary.pending)} toneClass="text-gold" />
          <KpiCard label="Cancelled" value={money(summary.cancelled)} toneClass="text-danger" />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Title or expense #"
            className="w-56 rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
          />
          <button type="submit" className="rounded-sm border border-ink bg-ink px-3 py-2 text-sm text-white">Search</button>
        </form>

        <select value={categoryId} onChange={(e) => { setPage(1); setCategoryId(e.target.value) }} className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }} className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink">
          {STATUS_OPTIONS.map((s) => <option key={s || 'all'} value={s}>{s || 'All statuses'}</option>)}
        </select>

        <select value={method} onChange={(e) => { setPage(1); setMethod(e.target.value) }} className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink">
          {METHOD_OPTIONS.map((m) => <option key={m || 'all'} value={m}>{m ? m.replace('_', ' ') : 'All methods'}</option>)}
        </select>

        {meta && <span className="ml-auto text-xs text-stone">{meta.total} expense{meta.total === 1 ? '' : 's'}</span>}
      </div>

      {loading && <OrderListSkeleton />}

      {!loading && expenses.length === 0 && (
        <div className="rounded-sm border border-dashed border-stone-light bg-white p-10 text-center text-sm text-stone">No expenses found.</div>
      )}

      {!loading && expenses.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-light text-xs uppercase tracking-wide text-stone">
                <th className="px-4 py-3 font-medium">Expense #</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-stone-light last:border-0 hover:bg-bone-dim">
                  <td className="px-4 py-3 font-mono text-xs text-ink">{e.expense_number}</td>
                  <td className="px-4 py-3 text-ink">{e.title}</td>
                  <td className="px-4 py-3 text-stone">{e.category?.name || '—'}</td>
                  <td className="px-4 py-3 text-stone">{e.expense_date}</td>
                  <td className="px-4 py-3 capitalize text-stone">{e.payment_method?.replace('_', ' ')}</td>
                  <td className="px-4 py-3 font-medium text-ink">{money(e.amount)}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(e.status)}>{e.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {e.status !== 'cancelled' && (
                        <Link to={`/admin/finance/expenses/${e.id}/edit`} className="text-xs font-medium text-ink hover:underline">Edit</Link>
                      )}
                      {e.status === 'pending' && (
                        <Button size="sm" onClick={() => handleMarkPaid(e)} loading={busyId === e.id}>Mark Paid</Button>
                      )}
                      {e.status !== 'cancelled' && (
                        <Button size="sm" variant="danger" onClick={() => handleCancel(e)} loading={busyId === e.id}>Cancel</Button>
                      )}
                    </div>
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
