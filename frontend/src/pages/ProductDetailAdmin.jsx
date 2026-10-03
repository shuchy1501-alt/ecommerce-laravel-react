import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { adminGetProduct, deleteProduct, duplicateProduct, updateProductStatus } from '@/api/productService'

function formatCurrency(value) {
  const number = Number(value)
  if (Number.isNaN(number)) return value
  return `৳${number.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
}

export default function ProductDetailAdmin() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast?.()
  const { can } = useAuth()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    adminGetProduct(id)
      .then((res) => setProduct(res.data))
      .catch((err) => toast?.error?.(err.message || 'Failed to load product.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const toggleStatus = async () => {
    try {
      await updateProductStatus(product.id, !product.status)
      toast?.success?.('Product status updated successfully')
      load()
    } catch (err) {
      toast?.error?.(err.response?.data?.message || err.message || 'Failed to update status.')
    }
  }

  const duplicate = async () => {
    try {
      const res = await duplicateProduct(product.id)
      toast?.success?.('Product duplicated successfully')
      navigate(`/admin/products/${res.data.id}/edit`)
    } catch (err) {
      toast?.error?.(err.response?.data?.message || err.message || 'Failed to duplicate product.')
    }
  }

  const remove = async () => {
    if (!window.confirm(`Delete product "${product.name}"? This cannot be undone.`)) return
    try {
      await deleteProduct(product.id)
      toast?.success?.('Product deleted successfully')
      navigate('/admin/products')
    } catch (err) {
      toast?.error?.(err.response?.data?.message || err.message || 'Failed to delete product.')
    }
  }

  if (loading) {
    return (
      <div className="rounded-sm border border-stone-light bg-white p-10 text-center text-sm text-stone">
        Loading product…
      </div>
    )
  }

  if (!product) return null

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">{product.name}</h1>
          <p className="mt-1 font-mono text-xs text-stone">{product.sku}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/admin/products')}>Back</Button>
          {can('products.update') && <Button variant="outline" onClick={toggleStatus}>{product.status ? 'Deactivate' : 'Activate'}</Button>}
          {can('products.create') && <Button variant="outline" onClick={duplicate}>Duplicate</Button>}
          {can('products.update') && <Button as={Link} to={`/admin/products/${product.id}/edit`}>Edit</Button>}
          {can('products.delete') && <Button variant="danger" onClick={remove}>Delete</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-sm border border-stone-light bg-white p-6">
            <h2 className="mb-3 font-display text-lg text-ink">Images</h2>
            {product.images?.length ? (
              <div className="flex flex-wrap gap-3">
                {product.images.map((img) => (
                  <div key={img.id} className="relative h-24 w-24">
                    <img src={img.image_url} alt="" className="h-24 w-24 rounded-sm object-cover" />
                    {img.is_primary && <span className="absolute left-1 top-1 rounded-sm bg-ink px-1.5 py-0.5 text-[10px] text-bone">Primary</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone">No images uploaded.</p>
            )}
          </div>

          <div className="rounded-sm border border-stone-light bg-white p-6">
            <h2 className="mb-3 font-display text-lg text-ink">Description</h2>
            <p className="text-sm text-stone">{product.short_description}</p>
            <p className="mt-2 whitespace-pre-line text-sm text-ink">{product.description || '—'}</p>
          </div>

          <div className="rounded-sm border border-stone-light bg-white p-6">
            <h2 className="mb-3 font-display text-lg text-ink">Variants</h2>
            {product.variants?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-light text-xs uppercase tracking-wide text-stone">
                      <th className="px-3 py-2 font-medium">SKU</th>
                      <th className="px-3 py-2 font-medium">Size</th>
                      <th className="px-3 py-2 font-medium">Color</th>
                      <th className="px-3 py-2 font-medium">Price</th>
                      <th className="px-3 py-2 font-medium">Stock</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((v) => (
                      <tr key={v.id} className="border-b border-stone-light last:border-0">
                        <td className="px-3 py-2 font-mono text-xs text-stone">{v.sku}</td>
                        <td className="px-3 py-2">{v.size || '—'}</td>
                        <td className="px-3 py-2">{v.color || '—'}</td>
                        <td className="px-3 py-2">{formatCurrency(v.final_price ?? v.selling_price)}</td>
                        <td className="px-3 py-2">
                          <Badge tone={v.stock_status === 'out_of_stock' ? 'danger' : v.stock_status === 'low_stock' ? 'warning' : 'success'}>
                            {v.stock} in stock
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <Badge tone={v.status ? 'success' : 'neutral'}>{v.status ? 'Active' : 'Inactive'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-stone">No variants — this product is sold without size/color options.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-sm border border-stone-light bg-white p-6">
            <h2 className="mb-3 font-display text-lg text-ink">Overview</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-stone">Category</dt><dd className="text-ink">{product.category?.name ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-stone">Subcategory</dt><dd className="text-ink">{product.subcategory?.name ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-stone">Brand</dt><dd className="text-ink">{product.brand?.name ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-stone">Purchase Price</dt><dd className="text-ink">{formatCurrency(product.purchase_price)}</dd></div>
              <div className="flex justify-between"><dt className="text-stone">Selling Price</dt><dd className="text-ink">{formatCurrency(product.selling_price)}</dd></div>
              <div className="flex justify-between"><dt className="text-stone">Final Price</dt><dd className="text-ink">{formatCurrency(product.final_price)}</dd></div>
              <div className="flex justify-between"><dt className="text-stone">Status</dt><dd><Badge tone={product.status ? 'success' : 'neutral'}>{product.status ? 'Active' : 'Inactive'}</Badge></dd></div>
              <div className="flex justify-between"><dt className="text-stone">Created</dt><dd className="text-ink">{new Date(product.created_at).toLocaleDateString()}</dd></div>
              <div className="flex justify-between"><dt className="text-stone">Updated</dt><dd className="text-ink">{new Date(product.updated_at).toLocaleDateString()}</dd></div>
            </dl>
          </div>

          <div className="rounded-sm border border-stone-light bg-white p-6">
            <h2 className="mb-3 font-display text-lg text-ink">Flags</h2>
            <div className="flex flex-wrap gap-2">
              {product.featured && <Badge tone="accent">Featured</Badge>}
              {product.new_arrival && <Badge tone="accent">New Arrival</Badge>}
              {product.best_seller && <Badge tone="accent">Best Seller</Badge>}
              {!product.featured && !product.new_arrival && !product.best_seller && <span className="text-sm text-stone">None set</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
