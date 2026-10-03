import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { CategoryTableSkeleton } from '@/components/ui/Skeleton'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/api/categoryService'

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  status: true,
  sort_order: 0,
  meta_title: '',
  meta_description: '',
  image: null,
}

export default function Categories() {
  const toast = useToast?.()
  const { can } = useAuth()
  const [categories, setCategories] = useState([])
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
    getCategories({ page, search: search || undefined, status: status || undefined, per_page: 15 })
      .then((res) => {
        setCategories(res.data || [])
        setMeta(res.meta || null)
      })
      .catch((err) => toast?.error?.(err.message || 'Failed to load categories.'))
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

  const openEdit = (category) => {
    setEditing(category)
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      status: category.status,
      sort_order: category.sort_order || 0,
      meta_title: category.meta_title || '',
      meta_description: category.meta_description || '',
      image: null,
    })
    setErrors({})
    setPreview(category.image_url || null)
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
        await updateCategory(editing.id, form)
        toast?.success?.('Category updated successfully')
      } else {
        await createCategory(form)
        toast?.success?.('Category created successfully')
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

  const remove = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"? This cannot be undone.`)) return
    try {
      await deleteCategory(category.id)
      toast?.success?.('Category deleted successfully')
      load()
    } catch (err) {
      toast?.error?.(err.response?.data?.message || err.message || 'Failed to delete category.')
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Categories</h1>
        {can('categories.create') && <Button onClick={openCreate}>+ Add Category</Button>}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
          placeholder="Search categories..."
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
        {meta && <span className="text-xs text-stone">{meta.total} categories</span>}
      </div>

      {loading && <CategoryTableSkeleton />}

      {!loading && categories.length === 0 && (
        <div className="rounded-sm border border-dashed border-stone-light bg-white p-10 text-center text-sm text-stone">
          No categories found.
        </div>
      )}

      {!loading && categories.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-light text-xs uppercase tracking-wide text-stone">
                <th className="px-4 py-3 font-medium">Image</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Subcategories</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Sort Order</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-stone-light last:border-0">
                  <td className="px-4 py-3">
                    {category.image_url ? (
                      <img src={category.image_url} alt={category.name} className="h-10 w-10 rounded-sm object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-sm bg-bone-dim" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink">{category.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-stone">{category.slug}</td>
                  <td className="px-4 py-3 text-stone">{category.subcategories_count ?? '—'}</td>
                  <td className="px-4 py-3 text-stone">{category.products_count ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={category.status ? 'success' : 'neutral'}>
                      {category.status ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-stone">{category.sort_order}</td>
                  <td className="px-4 py-3 text-right">
                    {can('categories.update') && (
                      <button onClick={() => openEdit(category)} className="mr-3 text-xs font-medium text-oxblood hover:underline">
                        Edit
                      </button>
                    )}
                    {can('categories.delete') && (
                      <button onClick={() => remove(category)} className="text-xs font-medium text-danger hover:underline">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'} size="lg">
        <form onSubmit={save} className="space-y-4">
          <Input
            label="Category Name"
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
            {errors.image?.[0] && <p className="mt-1 text-xs text-danger">{errors.image[0]}</p>}
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
          <details className="rounded-sm border border-stone-light p-3">
            <summary className="cursor-pointer text-xs font-utility uppercase tracking-wider text-stone">SEO (optional)</summary>
            <div className="mt-3 space-y-3">
              <Input
                label="Meta Title"
                value={form.meta_title}
                onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
              />
              <Input
                label="Meta Description"
                value={form.meta_description}
                onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
              />
            </div>
          </details>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
