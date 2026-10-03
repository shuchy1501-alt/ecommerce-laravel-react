import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { adminGetProducts, deleteProduct, duplicateProduct, updateProductStatus } from '@/api/productService'
import { getActiveCategories } from '@/api/categoryService'
import { getActiveBrands } from '@/api/brandService'
import { getSubcategoriesForCategory } from '@/api/categoryService'
import { ProductTableSkeleton } from '@/components/ui/Skeleton'

function formatCurrency(value) {
  const number = Number(value)
  if (Number.isNaN(number)) return value
  return `৳${number.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
}

function stockLabel(product) {
  if (!product.variants || product.variants.length === 0) return { label: '—', tone: 'neutral' }
  const total = product.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0)
  if (total <= 0) return { label: 'Out of Stock', tone: 'danger' }
  const anyLow = product.variants.some((v) => v.stock > 0 && v.stock <= v.minimum_stock)
  return anyLow ? { label: `Low (${total})`, tone: 'warning' } : { label: `${total} in stock`, tone: 'success' }
}

export default function Products() {
  const toast = useToast?.()
  const { can } = useAuth()

  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [status, setStatus] = useState('')
  const [featured, setFeatured] = useState(false)
  const [sort, setSort] = useState('latest')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [bulkWorking, setBulkWorking] = useState(false)

  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [brands, setBrands] = useState([])

  useEffect(() => {
    getActiveCategories().then((res) => setCategories(res.data || [])).catch(() => {})
    getActiveBrands().then((res) => setBrands(res.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!categoryId) {
      setSubcategories([])
      setSubcategoryId('')
      return
    }
    getSubcategoriesForCategory(categoryId).then((res) => setSubcategories(res.data || [])).catch(() => {})
  }, [categoryId])

  const load = () => {
    setLoading(true)
    adminGetProducts({
      page,
      search: search || undefined,
      category_id: categoryId || undefined,
      subcategory_id: subcategoryId || undefined,
      brand_id: brandId || undefined,
      status: status || undefined,
      featured: featured || undefined,
      sort,
      per_page: 15,
    })
      .then((res) => {
        setProducts(res.data || [])
        setMeta(res.meta || null)
      })
      .catch((err) => toast?.error?.(err.message || 'Failed to load products.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [page, search, categoryId, subcategoryId, brandId, status, featured, sort])

  useEffect(() => setSelected([]), [products])

  const toggleSelected = (id) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const toggleSelectAll = () => {
    setSelected((s) => (s.length === products.length ? [] : products.map((p) => p.id)))
  }

  const bulkSetStatus = async (nextStatus) => {
    setBulkWorking(true)
    try {
      await Promise.all(selected.map((id) => updateProductStatus(id, nextStatus)))
      toast?.success?.(`${selected.length} product(s) ${nextStatus ? 'activated' : 'deactivated'} successfully`)
      setSelected([])
      load()
    } catch (err) {
      toast?.error?.(err.message || 'Failed to update selected products.')
    } finally {
      setBulkWorking(false)
    }
  }

  const toggleStatus = async (product) => {
    try {
      await updateProductStatus(product.id, !product.status)
      toast?.success?.('Product status updated successfully')
      load()
    } catch (err) {
      toast?.error?.(err.response?.data?.message || err.message || 'Failed to update status.')
    }
  }

  const duplicate = async (product) => {
    try {
      await duplicateProduct(product.id)
      toast?.success?.('Product duplicated successfully')
      load()
    } catch (err) {
      toast?.error?.(err.response?.data?.message || err.message || 'Failed to duplicate product.')
    }
  }

  const remove = async (product) => {
    if (!window.confirm(`Delete product "${product.name}"? This cannot be undone.`)) return
    try {
      await deleteProduct(product.id)
      toast?.success?.('Product deleted successfully')
      load()
    } catch (err) {
      toast?.error?.(err.response?.data?.message || err.message || 'Failed to delete product.')
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Products</h1>
        {can('products.create') && (
          <Button as={Link} to="/admin/products/create">+ Add Product</Button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value) }}
          placeholder="Search by name or SKU..."
          className="w-full max-w-xs rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        />
        <select value={categoryId} onChange={(e) => { setPage(1); setCategoryId(e.target.value) }}
          className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={subcategoryId} onChange={(e) => { setPage(1); setSubcategoryId(e.target.value) }}
          disabled={!categoryId}
          className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink disabled:opacity-50">
          <option value="">All Subcategories</option>
          {subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={brandId} onChange={(e) => { setPage(1); setBrandId(e.target.value) }}
          className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink">
          <option value="">All Brands</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }}
          className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink">
          <option value="">All Statuses</option>
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={featured} onChange={(e) => { setPage(1); setFeatured(e.target.checked) }} />
          Featured only
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink">
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A-Z</option>
          <option value="name_desc">Name: Z-A</option>
        </select>
        {meta && <span className="text-xs text-stone">{meta.total} products</span>}
      </div>

      {loading && <ProductTableSkeleton />}

      {!loading && products.length === 0 && (
        <div className="rounded-sm border border-dashed border-stone-light bg-white p-10 text-center text-sm text-stone">
          No products found.
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
          {selected.length > 0 && can('products.update') && (
            <div className="flex items-center justify-between border-b border-stone-light bg-bone-dim px-4 py-2 text-sm">
              <span className="text-ink">{selected.length} selected</span>
              <div className="flex gap-3">
                <button disabled={bulkWorking} onClick={() => bulkSetStatus(true)} className="text-xs font-medium text-oxblood hover:underline disabled:opacity-50">
                  Activate
                </button>
                <button disabled={bulkWorking} onClick={() => bulkSetStatus(false)} className="text-xs font-medium text-ink hover:underline disabled:opacity-50">
                  Deactivate
                </button>
              </div>
            </div>
          )}
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-light text-xs uppercase tracking-wide text-stone">
                <th className="px-4 py-3 font-medium">
                  <input type="checkbox" checked={selected.length === products.length} onChange={toggleSelectAll} />
                </th>
                <th className="px-4 py-3 font-medium">Image</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Brand</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Featured</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const stock = stockLabel(product)
                const primaryImage = product.images?.find((i) => i.is_primary) || product.images?.[0]
                return (
                  <tr key={product.id} className="border-b border-stone-light last:border-0">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(product.id)} onChange={() => toggleSelected(product.id)} />
                    </td>
                    <td className="px-4 py-3">
                      {primaryImage ? (
                        <img src={primaryImage.image_url} alt={product.name} className="h-10 w-10 rounded-sm object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-sm bg-bone-dim" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink">
                      <Link to={`/admin/products/${product.id}`} className="hover:underline">{product.name}</Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-stone">{product.sku}</td>
                    <td className="px-4 py-3 text-stone">{product.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-stone">{product.brand?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-ink">{formatCurrency(product.final_price ?? product.selling_price)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={stock.tone}>{stock.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => can('products.update') && toggleStatus(product)}
                        disabled={!can('products.update')}
                        className="disabled:cursor-default"
                      >
                        <Badge tone={product.status ? 'success' : 'neutral'}>{product.status ? 'Active' : 'Inactive'}</Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3">{product.featured ? <Badge tone="accent">Featured</Badge> : '—'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {can('products.update') && (
                        <Link to={`/admin/products/${product.id}/edit`} className="mr-3 text-xs font-medium text-oxblood hover:underline">
                          Edit
                        </Link>
                      )}
                      {can('products.create') && (
                        <button onClick={() => duplicate(product)} className="mr-3 text-xs font-medium text-ink hover:underline">
                          Duplicate
                        </button>
                      )}
                      {can('products.delete') && (
                        <button onClick={() => remove(product)} className="text-xs font-medium text-danger hover:underline">
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
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
    </div>
  )
}
