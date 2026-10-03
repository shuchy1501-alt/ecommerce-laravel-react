import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/api/supplierService'

const EMPTY_FORM = {
  name: '', company_name: '', phone: '', email: '', address: '', city: '', country: '',
  tax_id: '', contact_person: '', notes: '', status: true,
}

export default function Suppliers() {
  const toast = useToast?.()
  const { can } = useAuth()
  const [suppliers, setSuppliers] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getSuppliers({ page, search: search || undefined, status: status || undefined, per_page: 15 })
      .then((res) => {
        setSuppliers(res.data || [])
        setMeta(res.meta || null)
      })
      .catch((err) => toast?.error?.(err.message || 'Failed to load suppliers.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [page, search, status])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (supplier) => {
    setEditing(supplier)
    setForm({
      name: supplier.name, company_name: supplier.company_name || '', phone: supplier.phone || '',
      email: supplier.email || '', address: supplier.address || '', city: supplier.city || '',
      country: supplier.country || '', tax_id: supplier.tax_id || '', contact_person: supplier.contact_person || '',
      notes: supplier.notes || '', status: supplier.status,
    })
    setErrors({})
    setModalOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      if (editing) {
        await updateSupplier(editing.id, form)
        toast?.success?.('Supplier updated successfully')
      } else {
        await createSupplier(form)
        toast?.success?.('Supplier created successfully')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
        toast?.error?.('Please correct the highlighted fields.')
      } else {
        toast?.error?.(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const remove = async (supplier) => {
    if (!window.confirm(`Delete supplier "${supplier.name}"? This cannot be undone.`)) return
    try {
      await deleteSupplier(supplier.id)
      toast?.success?.('Supplier deleted successfully')
      load()
    } catch (err) {
      toast?.error?.(err.response?.data?.message || err.message || 'Failed to delete supplier.')
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Suppliers</h1>
        {can('suppliers.create') && <Button onClick={openCreate}>+ Add Supplier</Button>}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
          placeholder="Search suppliers..."
          className="w-full max-w-sm rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1)
            setStatus(e.target.value)
          }}
          className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        >
          <option value="">All Statuses</option>
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </select>
        {meta && <span className="text-xs text-stone">{meta.total} suppliers</span>}
      </div>

      {loading && <div className="h-64 animate-pulse rounded-sm bg-bone-dim" />}

      {!loading && suppliers.length === 0 && (
        <div className="rounded-sm border border-dashed border-stone-light bg-white p-10 text-center text-sm text-stone">
          No suppliers found.
        </div>
      )}

      {!loading && suppliers.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-light bg-bone-dim/60 text-[11px] uppercase tracking-wider text-stone">
                <th className="px-4 py-3 font-utility">Name</th>
                <th className="px-4 py-3 font-utility">Company</th>
                <th className="px-4 py-3 font-utility">Phone</th>
                <th className="px-4 py-3 font-utility">Purchases</th>
                <th className="px-4 py-3 font-utility">Status</th>
                <th className="px-4 py-3 font-utility text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-b border-stone-light last:border-0">
                  <td className="px-4 py-3">
                    <Link to={`/admin/suppliers/${s.id}`} className="text-ink hover:underline">
                      {s.name}
                    </Link>
                    {s.email && <p className="text-xs text-stone">{s.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-stone">{s.company_name || '—'}</td>
                  <td className="px-4 py-3 text-stone">{s.phone || '—'}</td>
                  <td className="px-4 py-3 text-stone">{s.purchases_count ?? 0}</td>
                  <td className="px-4 py-3">
                    <Badge tone={s.status ? 'success' : 'neutral'}>{s.status ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {can('suppliers.edit') && (
                      <button onClick={() => openEdit(s)} className="mr-3 text-xs font-medium text-oxblood hover:underline">
                        Edit
                      </button>
                    )}
                    {can('suppliers.delete') && (
                      <button onClick={() => remove(s)} className="text-xs font-medium text-danger hover:underline">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {meta && (
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              total={meta.total}
              perPage={meta.per_page}
              onPageChange={setPage}
            />
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Supplier Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name?.[0]} />
            <Input label="Company Name" value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} error={errors.company_name?.[0]} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} error={errors.phone?.[0]} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} error={errors.email?.[0]} />
            <Input label="Contact Person" value={form.contact_person} onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))} error={errors.contact_person?.[0]} />
            <Input label="Tax / Business ID" value={form.tax_id} onChange={(e) => setForm((f) => ({ ...f, tax_id: e.target.value }))} error={errors.tax_id?.[0]} />
            <Input label="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} error={errors.city?.[0]} />
            <Input label="Country" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} error={errors.country?.[0]} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">Address</label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">Status</label>
            <select
              value={form.status ? '1' : '0'}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value === '1' }))}
              className="w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save Changes' : 'Create Supplier'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
