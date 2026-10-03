import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { fetchExpense, updateExpense, fetchExpenseCategories } from '@/api/expenseService'
import { useToast } from '@/context/ToastContext'

const METHODS = ['cash', 'bank', 'card', 'mobile_banking', 'other']

export default function ExpenseEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('pending')
  const [form, setForm] = useState(null)

  useEffect(() => {
    Promise.all([fetchExpense(id), fetchExpenseCategories()])
      .then(([expenseRes, catRes]) => {
        const e = expenseRes.data
        setStatus(e.status)
        setForm({
          expense_category_id: e.expense_category_id,
          title: e.title,
          amount: e.amount,
          expense_date: e.expense_date,
          payment_method: e.payment_method,
          reference: e.reference || '',
          description: e.description || '',
        })
        setCategories((catRes.data || []).filter((c) => c.status || c.id === e.expense_category_id))
      })
      .catch((err) => toast.error(err.message || 'Could not load this expense.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    try {
      await updateExpense(id, { ...form, amount: Number(form.amount) })
      toast.success('Expense updated.')
      navigate('/admin/finance/expenses')
    } catch (err) {
      if (err.errors) setErrors(err.errors)
      toast.error(err.message || 'Could not update this expense.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="rounded-sm border border-stone-light bg-white p-10 text-center text-sm text-stone">Loading…</div>
  if (!form) return null

  return (
    <div className="mx-auto max-w-xl">
      <Link to="/admin/finance/expenses" className="text-xs text-stone hover:underline">← Back to Expenses</Link>
      <div className="mt-1 mb-6 flex items-center gap-2">
        <h1 className="font-display text-2xl text-ink">Edit Expense</h1>
        <Badge tone={status === 'paid' ? 'success' : status === 'cancelled' ? 'danger' : 'neutral'}>{status}</Badge>
      </div>

      {status === 'paid' && (
        <p className="mb-4 rounded-sm border border-gold/40 bg-gold/10 px-4 py-2 text-xs text-ink">
          This expense is already paid — its recorded financial transaction will be updated to match any changes you save here.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-sm border border-stone-light bg-white p-6">
        <div>
          <label className="text-xs font-utility uppercase tracking-wider text-stone">Expense Category *</label>
          <select
            required
            value={form.expense_category_id}
            onChange={set('expense_category_id')}
            className="mt-1.5 w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
          >
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.expense_category_id && <p className="mt-1 text-xs text-danger">{errors.expense_category_id[0]}</p>}
        </div>

        <Input label="Title" required value={form.title} onChange={set('title')} error={errors.title?.[0]} />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Amount (৳)" type="number" min="0.01" step="0.01" required value={form.amount} onChange={set('amount')} error={errors.amount?.[0]} />
          <Input label="Date" type="date" required value={form.expense_date} onChange={set('expense_date')} error={errors.expense_date?.[0]} />
        </div>

        <div>
          <label className="text-xs font-utility uppercase tracking-wider text-stone">Payment Method *</label>
          <select
            required
            value={form.payment_method}
            onChange={set('payment_method')}
            className="mt-1.5 w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
          >
            {METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
          </select>
        </div>

        <Input label="Reference (optional)" value={form.reference} onChange={set('reference')} />

        <div>
          <label className="text-xs font-utility uppercase tracking-wider text-stone">Description (optional)</label>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={3}
            className="mt-1.5 w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
          />
        </div>

        <Button type="submit" loading={saving} className="w-full">Save Changes</Button>
      </form>
    </div>
  )
}
