import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { CategoryTableSkeleton } from '@/components/ui/Skeleton'
import { getActiveCategories } from '@/api/categoryService'
import {
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from '@/api/subcategoryService'

const EMPTY_FORM = {
  category_id: '',
  name: '',
  slug: '',
  description: '',
  status: true,
  sort_order: 0,
  image: null,
}

export default function Subcategories() {
  const toast = useToast?.()
  const { can } = useAuth()
  const [subcategories, setSubcategories] = useState([])
  const [categories, setCategories] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    getActiveCategories().then((res) => setCategories(res.data || [])).catch(() => {})
  }, [])

  const load = () => {
    setLoading(true)
    getSubcategories({
      page,
      search: search || undefined,
      category_id: categoryFilter || undefined,
      per_page: 15,
    })
      .then((res) => {
        setSubcategories(res.data || [])
        setMeta(res.meta || null)
      })
      .catch((err) => toast?.error?.(err.message || 'Failed to load subcategories.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [page, search, categoryFilter])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setPreview(null)
    setModalOpen(true)
  }

  const openEdit = (subcategory) => {
    setEditing(subcategory)
    setForm({
      category_id: subcategory.category_id,
      name: subcategory.name,
      slug: subcategory.slug,
      description: subcategory.description || '',
      status: subcategory.status,
      sort_order: subcategory.sort_order || 0,
      image: null,
    })
    setErrors({})
    setPreview(subcategory.image_url || null)
    setModalOpen(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setForm((f) => ({ ...f, image: file }))
    setPreview(URL.createObjectURL(file))
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      if (editing) {
        await updateSubcategory(editing.id, form)
        toast?.success?.('Subcategory updated successfully')
      } else {
        await createSubcategory(form)
        toast?.success?.('Subcategory created successfully')
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

  const remove = async (subcategory) => {
    if (!window.confirm(`Delete subcategory "${subcategory.name}"? This cannot be undone.`)) return
    try {
      await deleteSubcategory(subcategory.id)
      toast?.success?.('Subcategory deleted successfully')
      load()
    } catch (err) {
      toast?.error?.(err.response?.data?.message || err.message || 'Failed to delete subcategory.')
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Subcategories</h1>
        {can('subcategories.create') && <Button onClick={openCreate}>+ Add Subcategory</Button>}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
          placeholder="Search subcategories..."
          className="w-full max-w-sm rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        />
        <select
          value={categoryFilter}
          onChange={(e) => {
            setPage(1)
            setCategoryFilter(e.target.value)
          }}
          className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {meta && <span className="text-xs text-stone">{meta.total} subcategories</span>}
      </div>

      {loading && <CategoryTableSkeleton />}

      {!loading && subcategories.length === 0 && (
        <div className="rounded-sm border border-dashed border-stone-light bg-white p-10 text-center text-sm text-stone">
          No subcategories found.
        </div>
      )}

      {!loading && subcategories.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-light text-xs uppercase tracking-wide text-stone">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subcategories.map((sub) => (
                <tr key={sub.id} className="border-b border-stone-light last:border-0">
                  <td className="px-4 py-3 text-ink">{sub.name}</td>
                  <td className="px-4 py-3 text-stone">{sub.category?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-stone">{sub.slug}</td>
                  <td className="px-4 py-3 text-stone">{sub.products_count ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={sub.status ? 'success' : 'neutral'}>{sub.status ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {can('subcategories.update') && (
                      <button onClick={() => openEdit(sub)} className="mr-3 text-xs font-medium text-oxblood hover:underline">
                        Edit
                      </button>
                    )}
                    {can('subcategories.delete') && (
                      <button onClick={() => remove(sub)} className="text-xs font-medium text-danger hover:underline">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Subcategory' : 'Add Subcategory'} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">
              Category <span className="text-oxblood">*</span>
            </label>
            <select
              required
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              className="w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.category_id?.[0] && <p className="mt-1 text-xs text-danger">{errors.category_id[0]}</p>}
          </div>
          <Input
            label="Subcategory Name"
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
            <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">Image</label>
            <div className="flex items-center gap-4">
              {preview && <img src={preview} alt="Preview" className="h-16 w-16 rounded-sm object-cover" />}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sort Order"
              type="number"
              min="0"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
            />
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
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save Changes' : 'Create Subcategory'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
