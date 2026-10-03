import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { fetchExpenseCategories, createExpenseCategory, updateExpenseCategory, deleteExpenseCategory } from '@/api/expenseService'
import { useToast } from '@/context/ToastContext'

export default function ExpenseCategories() {
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', status: true })

  const load = () => {
    setLoading(true)
    fetchExpenseCategories()
      .then((res) => setCategories(res.data || []))
      .catch((err) => toast.error(err.message || 'Failed to load categories.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createExpenseCategory(form)
      toast.success('Category created.')
      setForm({ name: '', description: '' })
      load()
    } catch (err) {
      toast.error(err.message || 'Could not create this category.')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (c) => {
    setEditingId(c.id)
    setEditForm({ name: c.name, description: c.description || '', status: c.status })
  }

  const handleUpdate = async (id) => {
    setSaving(true)
    try {
      await updateExpenseCategory(id, editForm)
      toast.success('Category updated.')
      setEditingId(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Could not update this category.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c) => {
    try {
      await deleteExpenseCategory(c.id)
      toast.success('Category deleted.')
      load()
    } catch (err) {
      toast.error(err.message || 'Could not delete this category.')
    }
  }

  return (
    <div>
      <Link to="/admin/finance/expenses" className="text-xs text-stone hover:underline">← Back to Expenses</Link>
      <h1 className="mt-1 mb-6 font-display text-2xl text-ink">Expense Categories</h1>

      <form onSubmit={handleCreate} className="mb-6 flex flex-wrap items-end gap-3 rounded-sm border border-stone-light bg-white p-4">
        <div className="w-56"><Input label="New category name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
        <div className="w-72"><Input label="Description (optional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
        <Button type="submit" loading={saving}>Add Category</Button>
      </form>

      {loading ? (
        <div className="rounded-sm border border-stone-light bg-white p-10 text-center text-sm text-stone">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-light text-xs uppercase tracking-wide text-stone">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Expenses</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-stone-light last:border-0 hover:bg-bone-dim">
                  {editingId === c.id ? (
                    <>
                      <td className="px-4 py-3"><input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-sm border border-stone-light px-2 py-1 text-sm" /></td>
                      <td className="px-4 py-3"><input value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-sm border border-stone-light px-2 py-1 text-sm" /></td>
                      <td className="px-4 py-3 text-stone">{c.expenses_count ?? 0}</td>
                      <td className="px-4 py-3">
                        <label className="flex items-center gap-2 text-xs text-stone">
                          <input type="checkbox" checked={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.checked }))} /> Active
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdate(c.id)} loading={saving}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                      <td className="px-4 py-3 text-stone">{c.description || '—'}</td>
                      <td className="px-4 py-3 text-stone">{c.expenses_count ?? 0}</td>
                      <td className="px-4 py-3"><Badge tone={c.status ? 'success' : 'neutral'}>{c.status ? 'Active' : 'Inactive'}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button type="button" onClick={() => startEdit(c)} className="text-xs font-medium text-ink hover:underline">Edit</button>
                          <button type="button" onClick={() => handleDelete(c)} className="text-xs font-medium text-danger hover:underline">Delete</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
