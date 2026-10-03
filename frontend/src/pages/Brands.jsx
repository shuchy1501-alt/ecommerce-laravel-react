import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { BrandTableSkeleton } from '@/components/ui/Skeleton'
import { getBrands, createBrand, updateBrand, deleteBrand } from '@/api/brandService'

const EMPTY_FORM = { name: '', slug: '', description: '', status: true, logo: null }

export default function Brands() {
  const toast = useToast?.()
  const { can } = useAuth()
  const [brands, setBrands] = useState([])
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
  const [preview, setPreview] = useState(null)

  const load = () => {
    setLoading(true)
    getBrands({ page, search: search || undefined, status: status || undefined, per_page: 15 })
      .then((res) => {
        setBrands(res.data || [])
        setMeta(res.meta || null)
      })
      .catch((err) => toast?.error?.(err.message || 'Failed to load brands.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [page, search, status])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setPreview(null)
    setModalOpen(true)
  }

  const openEdit = (brand) => {
    setEditing(brand)
    setForm({ name: brand.name, slug: brand.slug, description: brand.description || '', status: brand.status, logo: null })
    setErrors({})
    setPreview(brand.logo_url || null)
    setModalOpen(true)
  }

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setForm((f) => ({ ...f, logo: file }))
    setPreview(URL.createObjectURL(file))
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      if (editing) {
        await updateBrand(editing.id, form)
        toast?.success?.('Brand updated successfully')
      } else {
        await createBrand(form)
        toast?.success?.('Brand created successfully')
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

  const remove = async (brand) => {
    if (!window.confirm(`Delete brand "${brand.name}"? This cannot be undone.`)) return
    try {
      await deleteBrand(brand.id)
      toast?.success?.('Brand deleted successfully')
      load()
    } catch (err) {
      toast?.error?.(err.response?.data?.message || err.message || 'Failed to delete brand.')
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Brands</h1>
        {can('brands.create') && <Button onClick={openCreate}>+ Add Brand</Button>}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
          placeholder="Search brands..."
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
        {meta && <span className="text-xs text-stone">{meta.total} brands</span>}
      </div>

      {loading && <BrandTableSkeleton />}

      {!loading && brands.length === 0 && (
        <div className="rounded-sm border border-dashed border-stone-light bg-white p-10 text-center text-sm text-stone">
          No brands found.
        </div>
      )}

      {!loading && brands.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-light text-xs uppercase tracking-wide text-stone">
                <th className="px-4 py-3 font-medium">Logo</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand.id} className="border-b border-stone-light last:border-0">
                  <td className="px-4 py-3">
                    {brand.logo_url ? (
                      <img src={brand.logo_url} alt={brand.name} className="h-10 w-10 rounded-sm object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-sm bg-bone-dim" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink">{brand.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-stone">{brand.slug}</td>
                  <td className="px-4 py-3 text-stone">{brand.products_count ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={brand.status ? 'success' : 'neutral'}>{brand.status ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {can('brands.update') && (
                      <button onClick={() => openEdit(brand)} className="mr-3 text-xs font-medium text-oxblood hover:underline">
                        Edit
                      </button>
                    )}
                    {can('brands.delete') && (
                      <button onClick={() => remove(brand)} className="text-xs font-medium text-danger hover:underline">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Brand' : 'Add Brand'}>
        <form onSubmit={save} className="space-y-4">
          <Input
            label="Brand Name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={errors.name?.[0]}
          />
          <Input
            label="Slug"
            hint="Leave blank to auto-generate from the name"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            error={errors.slug?.[0]}
          />
          <div>
            <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">Logo</label>
            <div className="flex items-center gap-4">
              {preview && <img src={preview} alt="Preview" className="h-16 w-16 rounded-sm object-cover" />}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} className="text-sm" />
            </div>
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
              {editing ? 'Save Changes' : 'Create Brand'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
