import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useToast } from '@/context/ToastContext'
import { getActiveCategories, getSubcategoriesForCategory } from '@/api/categoryService'
import { getActiveBrands } from '@/api/brandService'
import {
  adminGetProduct,
  createProduct,
  updateProduct,
  deleteProductImage,
} from '@/api/productService'
import { generateVariantCombinations } from '@/api/variantService'
import { ProductFormSkeleton } from '@/components/ui/Skeleton'

const SECTIONS = ['Basic Info', 'Category', 'Pricing', 'Images', 'Variants', 'SEO', 'Visibility']

const EMPTY_FORM = {
  name: '',
  sku: '',
  slug: '',
  description: '',
  short_description: '',
  category_id: '',
  subcategory_id: '',
  brand_id: '',
  unit_id: '',
  purchase_price: '',
  selling_price: '',
  discount_type: '',
  discount_value: '',
  status: false,
  featured: false,
  new_arrival: false,
  best_seller: false,
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function calcFinalPrice(price, discountType, discountValue) {
  const p = Number(price) || 0
  const d = Number(discountValue) || 0
  if (discountType === 'flat') return Math.max(0, p - d)
  if (discountType === 'percentage') return Math.max(0, p - (p * d) / 100)
  return p
}

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast?.()

  const [activeSection, setActiveSection] = useState('Basic Info')
  const [form, setForm] = useState(EMPTY_FORM)
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [brands, setBrands] = useState([])
  const [units, setUnits] = useState([])

  // Images: existing (already uploaded) + new (File objects pending upload)
  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages] = useState([])

  // Variants: rows the admin is editing. Each row may have an `id` (existing)
  // or not (new / freshly generated, not yet saved).
  const [variants, setVariants] = useState([])
  const [sizesInput, setSizesInput] = useState('')
  const [colorsInput, setColorsInput] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    getActiveCategories().then((res) => setCategories(res.data || [])).catch(() => {})
    getActiveBrands().then((res) => setBrands(res.data || [])).catch(() => {})
    // Units are lightweight and rarely change; a dedicated endpoint isn't in
    // scope for Phase 6, so fall back to a sensible default list if a units
    // API isn't wired up yet.
    setUnits([{ id: 1, name: 'Piece' }, { id: 2, name: 'Pair' }, { id: 3, name: 'Set' }])
  }, [])

  useEffect(() => {
    if (!form.category_id) {
      setSubcategories([])
      return
    }
    getSubcategoriesForCategory(form.category_id).then((res) => setSubcategories(res.data || [])).catch(() => {})
  }, [form.category_id])

  useEffect(() => {
    if (!isEdit) return
    adminGetProduct(id)
      .then((res) => {
        const p = res.data
        setForm({
          name: p.name || '',
          sku: p.sku || '',
          slug: p.slug || '',
          description: p.description || '',
          short_description: p.short_description || '',
          category_id: p.category?.id || '',
          subcategory_id: p.subcategory?.id || '',
          brand_id: p.brand?.id || '',
          unit_id: p.unit?.id || '',
          purchase_price: p.purchase_price ?? '',
          selling_price: p.selling_price ?? '',
          discount_type: p.discount_type || '',
          discount_value: p.discount_value ?? '',
          status: p.status,
          featured: p.featured,
          new_arrival: p.new_arrival,
          best_seller: p.best_seller,
          meta_title: p.meta_title || '',
          meta_description: p.meta_description || '',
          meta_keywords: p.meta_keywords || '',
        })
        setExistingImages(p.images || [])
        setVariants((p.variants || []).map((v) => ({ ...v, _key: `existing-${v.id}` })))
        setSlugTouched(true)
      })
      .catch((err) => toast?.error?.(err.message || 'Failed to load product.'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const finalPrice = useMemo(
    () => calcFinalPrice(form.selling_price, form.discount_type, form.discount_value),
    [form.selling_price, form.discount_type, form.discount_value]
  )

  const setField = (key, value) => {
    setForm((f) => {
      const next = { ...f, [key]: value }
      if (key === 'name' && !slugTouched) {
        next.slug = slugify(value)
      }
      return next
    })
  }

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files || [])
    if (existingImages.length + newImages.length + files.length > 6) {
      toast?.error?.('You can have at most 6 images per product.')
      return
    }
    setNewImages((imgs) => [...imgs, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))])
  }

  const removeNewImage = (index) => {
    setNewImages((imgs) => imgs.filter((_, i) => i !== index))
  }

  const removeExistingImage = async (image) => {
    if (!isEdit) return
    if (!window.confirm('Remove this image?')) return
    try {
      await deleteProductImage(id, image.id)
      setExistingImages((imgs) => imgs.filter((i) => i.id !== image.id))
      toast?.success?.('Image deleted successfully')
    } catch (err) {
      toast?.error?.(err.message || 'Failed to delete image.')
    }
  }

  // --- Variant generator ---------------------------------------------------

  const runGenerator = async () => {
    const sizes = sizesInput.split(',').map((s) => s.trim()).filter(Boolean)
    const colors = colorsInput.split(',').map((c) => c.trim()).filter(Boolean)
    if (sizes.length === 0 || colors.length === 0) {
      toast?.error?.('Enter at least one size and one color.')
      return
    }

    // Not yet saved (create flow) — generate combinations locally instead of
    // calling the backend, which needs a persisted product to check for
    // existing SKUs against.
    if (!isEdit) {
      const existingCombos = new Set(variants.map((v) => `${v.size}|${v.color}`))
      const generated = []
      colors.forEach((color) => {
        sizes.forEach((size) => {
          if (existingCombos.has(`${size}|${color}`)) return
          generated.push({
            _key: `new-${Date.now()}-${color}-${size}`,
            size,
            color,
            sku: '',
            purchase_price: form.purchase_price || '',
            selling_price: form.selling_price || '',
            stock: 0,
            minimum_stock: 0,
            status: true,
          })
        })
      })
      setVariants((v) => [...v, ...generated])
      return
    }

    setGenerating(true)
    try {
      const res = await generateVariantCombinations(id, { sizes, colors })
      const generated = (res.data || []).map((c) => ({ ...c, _key: `new-${Date.now()}-${c.color}-${c.size}` }))
      setVariants((v) => [...v, ...generated])
    } catch (err) {
      toast?.error?.(err.message || 'Failed to generate variant combinations.')
    } finally {
      setGenerating(false)
    }
  }

  const updateVariantField = (key, field, value) => {
    setVariants((vs) => vs.map((v) => (v._key === key ? { ...v, [field]: value } : v)))
  }

  const removeVariantRow = (key) => {
    setVariants((vs) => vs.filter((v) => v._key !== key))
  }

  const variantErrors = useMemo(() => {
    const seen = new Map()
    const dupes = new Set()
    variants.forEach((v) => {
      const combo = `${v.size}|${v.color}`
      if (seen.has(combo)) dupes.add(combo)
      seen.set(combo, true)
    })
    return dupes
  }, [variants])

  // --- Submit ---------------------------------------------------------------

  const save = async (e) => {
    e.preventDefault()

    if (Number(form.discount_value) > 0) {
      if (form.discount_type === 'flat' && Number(form.discount_value) > Number(form.selling_price)) {
        toast?.error?.('The discount cannot exceed the selling price.')
        return
      }
      if (form.discount_type === 'percentage' && Number(form.discount_value) > 100) {
        toast?.error?.('The percentage discount cannot exceed 100.')
        return
      }
    }

    if (variantErrors.size > 0) {
      toast?.error?.('Remove duplicate size/color variant combinations before saving.')
      return
    }

    setSaving(true)
    setErrors({})

    const payload = {
      ...form,
      subcategory_id: form.subcategory_id || null,
      brand_id: form.brand_id || null,
      discount_type: form.discount_type || null,
      images: newImages.map((i) => i.file),
      variants: variants.map(({ _key, ...v }) => v),
    }

    try {
      if (isEdit) {
        await updateProduct(id, payload)
        toast?.success?.('Product updated successfully')
      } else {
        await createProduct(payload)
        toast?.success?.('Product created successfully')
      }
      navigate('/admin/products')
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
        toast?.error?.('Please correct the highlighted fields.')
      } else if (err.response?.status === 403) {
        toast?.error?.('You do not have permission to manage products.')
      } else {
        toast?.error?.(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <ProductFormSkeleton />
  }

  return (
    <form onSubmit={save}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">{isEdit ? 'Edit Product' : 'Create Product'}</h1>
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate('/admin/products')}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex gap-1 overflow-x-auto lg:w-48 lg:flex-col lg:gap-0.5">
          {SECTIONS.map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className={`whitespace-nowrap rounded-sm px-4 py-2 text-left text-sm transition-colors ${
                activeSection === section ? 'bg-ink text-bone' : 'text-ink hover:bg-bone-dim'
              }`}
            >
              {section}
            </button>
          ))}
        </nav>

        <div className="flex-1 rounded-sm border border-stone-light bg-white p-6">
          {activeSection === 'Basic Info' && (
            <div className="space-y-4">
              <Input label="Product Name" required value={form.name} onChange={(e) => setField('name', e.target.value)} error={errors.name?.[0]} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="SKU" required value={form.sku} onChange={(e) => setField('sku', e.target.value)} error={errors.sku?.[0]} />
                <Input
                  label="Slug"
                  value={form.slug}
                  onChange={(e) => { setSlugTouched(true); setField('slug', e.target.value) }}
                  error={errors.slug?.[0]}
                  hint="Auto-generated from name; edit if needed"
                />
              </div>
              <Input
                label="Short Description"
                value={form.short_description}
                onChange={(e) => setField('short_description', e.target.value)}
              />
              <div>
                <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">Description</label>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  className="w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
                />
              </div>
            </div>
          )}

          {activeSection === 'Category' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">
                  Category <span className="text-oxblood">*</span>
                </label>
                <select
                  required
                  value={form.category_id}
                  onChange={(e) => setField('category_id', e.target.value)}
                  className="w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.category_id?.[0] && <p className="mt-1 text-xs text-danger">{errors.category_id[0]}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">Subcategory</label>
                <select
                  value={form.subcategory_id}
                  onChange={(e) => setField('subcategory_id', e.target.value)}
                  disabled={!form.category_id}
                  className="w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood disabled:opacity-50"
                >
                  <option value="">Select a subcategory</option>
                  {subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">Brand</label>
                <select
                  value={form.brand_id}
                  onChange={(e) => setField('brand_id', e.target.value)}
                  className="w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
                >
                  <option value="">Select a brand</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">
                  Unit <span className="text-oxblood">*</span>
                </label>
                <select
                  required
                  value={form.unit_id}
                  onChange={(e) => setField('unit_id', e.target.value)}
                  className="w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
                >
                  <option value="">Select a unit</option>
                  {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                {errors.unit_id?.[0] && <p className="mt-1 text-xs text-danger">{errors.unit_id[0]}</p>}
              </div>
            </div>
          )}

          {activeSection === 'Pricing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Purchase Price"
                  type="number" min="0" step="0.01" required
                  value={form.purchase_price}
                  onChange={(e) => setField('purchase_price', e.target.value)}
                  error={errors.purchase_price?.[0]}
                />
                <Input
                  label="Selling Price"
                  type="number" min="0" step="0.01" required
                  value={form.selling_price}
                  onChange={(e) => setField('selling_price', e.target.value)}
                  error={errors.selling_price?.[0]}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">Discount Type</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setField('discount_type', e.target.value)}
                    className="w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
                  >
                    <option value="">No Discount</option>
                    <option value="percentage">Percentage</option>
                    <option value="flat">Fixed Amount</option>
                  </select>
                </div>
                <Input
                  label="Discount Value"
                  type="number" min="0" step="0.01"
                  disabled={!form.discount_type}
                  value={form.discount_value}
                  onChange={(e) => setField('discount_value', e.target.value)}
                  error={errors.discount_value?.[0]}
                />
              </div>
              <div className="rounded-sm bg-bone-dim px-4 py-3 text-sm text-ink">
                Final Price: <span className="font-semibold">৳{finalPrice.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          {activeSection === 'Images' && (
            <div className="space-y-4">
              <p className="text-xs text-stone">Recommended: 3–6 images. jpg, jpeg, png, webp.</p>
              <div className="flex flex-wrap gap-3">
                {existingImages.map((img) => (
                  <div key={img.id} className="group relative h-24 w-24">
                    <img src={img.image_url} alt="" className="h-24 w-24 rounded-sm object-cover" />
                    {img.is_primary && <span className="absolute left-1 top-1 rounded-sm bg-ink px-1.5 py-0.5 text-[10px] text-bone">Primary</span>}
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img)}
                      className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-danger text-xs text-white group-hover:flex"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                {newImages.map((img, i) => (
                  <div key={i} className="group relative h-24 w-24">
                    <img src={img.preview} alt="" className="h-24 w-24 rounded-sm object-cover" />
                    <span className="absolute left-1 top-1 rounded-sm bg-gold px-1.5 py-0.5 text-[10px] text-ink">New</span>
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-danger text-xs text-white group-hover:flex"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleNewImages} className="text-sm" />
              {errors.images?.[0] && <p className="text-xs text-danger">{errors.images[0]}</p>}
            </div>
          )}

          {activeSection === 'Variants' && (
            <div className="space-y-4">
              <div className="rounded-sm border border-stone-light bg-bone-dim p-4">
                <p className="mb-3 text-xs font-utility uppercase tracking-wider text-stone">Variant Generator</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Sizes" placeholder="S, M, L, XL" value={sizesInput} onChange={(e) => setSizesInput(e.target.value)} />
                  <Input label="Colors" placeholder="Black, White, Blue" value={colorsInput} onChange={(e) => setColorsInput(e.target.value)} />
                </div>
                <Button type="button" size="sm" variant="outline" className="mt-3" onClick={runGenerator} loading={generating}>
                  Generate Combinations
                </Button>
              </div>

              {variants.length === 0 && (
                <p className="text-sm text-stone">No variants yet. Use the generator above, or this product will be sold without size/color options.</p>
              )}

              {variants.length > 0 && (
                <div className="overflow-x-auto rounded-sm border border-stone-light">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-light bg-bone-dim text-xs uppercase tracking-wide text-stone">
                        <th className="px-3 py-2 font-medium">SKU</th>
                        <th className="px-3 py-2 font-medium">Size</th>
                        <th className="px-3 py-2 font-medium">Color</th>
                        <th className="px-3 py-2 font-medium">Purchase Price</th>
                        <th className="px-3 py-2 font-medium">Selling Price</th>
                        <th className="px-3 py-2 font-medium">Stock</th>
                        <th className="px-3 py-2 font-medium">Min Stock</th>
                        <th className="px-3 py-2 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v) => {
                        const isDupe = variantErrors.has(`${v.size}|${v.color}`)
                        return (
                          <tr key={v._key} className={`border-b border-stone-light last:border-0 ${isDupe ? 'bg-danger/5' : ''}`}>
                            <td className="px-3 py-2">
                              <input
                                value={v.sku}
                                onChange={(e) => updateVariantField(v._key, 'sku', e.target.value)}
                                className="w-32 rounded-sm border border-stone-light px-2 py-1 text-xs"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                value={v.size || ''}
                                onChange={(e) => updateVariantField(v._key, 'size', e.target.value)}
                                className="w-16 rounded-sm border border-stone-light px-2 py-1 text-xs"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                value={v.color || ''}
                                onChange={(e) => updateVariantField(v._key, 'color', e.target.value)}
                                className="w-20 rounded-sm border border-stone-light px-2 py-1 text-xs"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number" min="0"
                                value={v.purchase_price ?? ''}
                                onChange={(e) => updateVariantField(v._key, 'purchase_price', e.target.value)}
                                className="w-24 rounded-sm border border-stone-light px-2 py-1 text-xs"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number" min="0"
                                value={v.selling_price ?? ''}
                                onChange={(e) => updateVariantField(v._key, 'selling_price', e.target.value)}
                                className="w-24 rounded-sm border border-stone-light px-2 py-1 text-xs"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number" min="0"
                                value={v.stock ?? 0}
                                onChange={(e) => updateVariantField(v._key, 'stock', e.target.value)}
                                className="w-16 rounded-sm border border-stone-light px-2 py-1 text-xs"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number" min="0"
                                value={v.minimum_stock ?? 0}
                                onChange={(e) => updateVariantField(v._key, 'minimum_stock', e.target.value)}
                                className="w-16 rounded-sm border border-stone-light px-2 py-1 text-xs"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <button type="button" onClick={() => removeVariantRow(v._key)} className="text-xs text-danger hover:underline">
                                Remove
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {variantErrors.size > 0 && (
                <p className="text-xs text-danger">Duplicate size/color combinations are highlighted above — remove or adjust them.</p>
              )}
            </div>
          )}

          {activeSection === 'SEO' && (
            <div className="space-y-4">
              <Input label="Meta Title" value={form.meta_title} onChange={(e) => setField('meta_title', e.target.value)} />
              <Input label="Meta Description" value={form.meta_description} onChange={(e) => setField('meta_description', e.target.value)} />
              <Input label="Meta Keywords" value={form.meta_keywords} onChange={(e) => setField('meta_keywords', e.target.value)} hint="Comma-separated" />
            </div>
          )}

          {activeSection === 'Visibility' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">Status</label>
                <select
                  value={form.status ? '1' : '0'}
                  onChange={(e) => setField('status', e.target.value === '1')}
                  className="w-full max-w-xs rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
                >
                  <option value="0">Draft / Inactive (hidden from website)</option>
                  <option value="1">Active (visible on website)</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setField('featured', e.target.checked)} />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={form.new_arrival} onChange={(e) => setField('new_arrival', e.target.checked)} />
                  New Arrival
                </label>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={form.best_seller} onChange={(e) => setField('best_seller', e.target.checked)} />
                  Best Seller
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}
