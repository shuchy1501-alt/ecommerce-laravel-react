import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { createExpense, fetchExpenseCategories } from '@/api/expenseService'
import { useToast } from '@/context/ToastContext'

const METHODS = ['cash', 'bank', 'card', 'mobile_banking', 'other']

export default function ExpenseCreate() {
  const navigate = useNavigate()
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    expense_category_id: '',
    title: '',
    amount: '',
    expense_date: new Date().toISOString().slice(0, 10),
    payment_method: 'cash',
    reference: '',
    description: '',
    status: 'pending',
  })

  useEffect(() => {
    fetchExpenseCategories()
      .then((res) => setCategories((res.data || []).filter((c) => c.status)))
      .catch(() => toast.error('Could not load expense categories.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    try {
      const { data } = await createExpense({ ...form, amount: Number(form.amount) })
      toast.success('Expense created.')
      navigate('/admin/finance/expenses')
      void data
    } catch (err) {
      if (err.errors) setErrors(err.errors)
      toast.error(err.message || 'Could not create this expense.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link to="/admin/finance/expenses" className="text-xs text-stone hover:underline">← Back to Expenses</Link>
      <h1 className="mt-1 mb-6 font-display text-2xl text-ink">New Expense</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-sm border border-stone-light bg-white p-6">
        <div>
          <label className="text-xs font-utility uppercase tracking-wider text-stone">Expense Category *</label>
          <select
            required
            value={form.expense_category_id}
            onChange={set('expense_category_id')}
            className="mt-1.5 w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
          >
            <option value="">Select a category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.expense_category_id && <p className="mt-1 text-xs text-danger">{errors.expense_category_id[0]}</p>}
        </div>

        <Input label="Title" required value={form.title} onChange={set('title')} error={errors.title?.[0]} placeholder="e.g. October office rent" />

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

        <Input label="Reference (optional)" value={form.reference} onChange={set('reference')} placeholder="Invoice #, cheque #, etc." />

        <div>
          <label className="text-xs font-utility uppercase tracking-wider text-stone">Description (optional)</label>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={3}
            className="mt-1.5 w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
          />
        </div>

        <div>
          <label className="text-xs font-utility uppercase tracking-wider text-stone">Status</label>
          <div className="mt-1.5 flex gap-3">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="radio" checked={form.status === 'pending'} onChange={() => setForm((f) => ({ ...f, status: 'pending' }))} /> Pending
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="radio" checked={form.status === 'paid'} onChange={() => setForm((f) => ({ ...f, status: 'paid' }))} /> Already Paid
            </label>
          </div>
        </div>

        <Button type="submit" loading={saving} className="w-full">Create Expense</Button>
      </form>
    </div>
  )
}
