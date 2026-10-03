import api from './axios'

/**
 * Product service (Phase 6).
 *
 * The Laravel catalog API is now live, so this talks to it directly —
 * the Phase 5 mock-data fallback has been removed. Components should only
 * ever import from this service, never from src/data/mockProducts directly.
 */

// Fallback swatch colors for storefront color pickers. The backend only
// stores a color *name* per variant (per the Phase 6 spec), not a hex value,
// so common names are mapped here and anything unrecognized falls back to a
// neutral gray swatch rather than crashing.
const COLOR_HEX_MAP = {
  black: '#111827',
  white: '#F9FAFB',
  red: '#DC2626',
  blue: '#2563EB',
  navy: '#1E3A8A',
  green: '#16A34A',
  yellow: '#EAB308',
  orange: '#EA580C',
  pink: '#EC4899',
  purple: '#9333EA',
  grey: '#9CA3AF',
  gray: '#9CA3AF',
  brown: '#78350F',
  beige: '#E7DDC9',
  maroon: '#7F1D1D',
}

function colorHex(name) {
  return COLOR_HEX_MAP[(name || '').trim().toLowerCase()] || '#9CA3AF'
}

/**
 * Maps a Phase 6 ProductResource (nested category/brand/variants/images)
 * into the flatter shape the Phase 5 storefront components were built
 * against (product.price, product.images as URL strings, product.colors as
 * {name, hex}, etc). Keeping this in one place means the API can evolve
 * without touching every component that renders a product.
 */
function normalizeProduct(p) {
  if (!p) return p

  const variants = p.variants || []
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))]
  const colorNames = [...new Set(variants.map((v) => v.color).filter(Boolean))]
  const hasDiscount = p.discount_type && Number(p.discount_value) > 0

  const badges = []
  if (p.new_arrival) badges.push('new')
  if (p.best_seller) badges.push('best-seller')
  if (hasDiscount) badges.push('sale')

  return {
    ...p,
    brand: p.brand?.name ?? '',
    category: p.category?.slug ?? '',
    images: (p.images || []).map((img) => img.image_url),
    price: Number(p.final_price ?? p.selling_price ?? 0),
    oldPrice: hasDiscount ? Number(p.selling_price) : null,
    rating: p.rating ?? 0,
    reviewCount: p.review_count ?? 0,
    badges,
    sizes,
    colors: colorNames.map((name) => ({ name, hex: colorHex(name) })),
    minStock: variants.length ? Math.min(...variants.map((v) => v.minimum_stock ?? 0)) : 0,
    variants: variants.map((v) => ({
      ...v,
      price: Number(v.final_price ?? v.selling_price ?? p.final_price ?? p.selling_price ?? 0),
    })),
  }
}

export function getProducts(params = {}) {
  return api.get('/products', { params }).then((res) => ({
    ...res.data,
    data: (res.data?.data || []).map(normalizeProduct),
  }))
}

export function getProductBySlugApi(slug) {
  return api.get(`/products/${slug}`).then((res) => normalizeProduct(res.data?.data ?? res.data))
}

export function getCategories() {
  return api.get('/categories/active').then((res) => res.data?.data ?? res.data)
}

export function getBrands() {
  return api.get('/brands/active').then((res) => res.data?.data ?? res.data)
}

// --- Admin CRUD -----------------------------------------------------------

function toFormData(payload) {
  const form = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return

    if (key === 'images' && Array.isArray(value)) {
      value.forEach((file) => form.append('images[]', file))
      return
    }

    if (key === 'variants' && Array.isArray(value)) {
      value.forEach((variant, index) => {
        Object.entries(variant).forEach(([vKey, vValue]) => {
          if (vValue === undefined || vValue === null) return
          form.append(`variants[${index}][${vKey}]`, vValue)
        })
      })
      return
    }

    form.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value)
  })

  return form
}

export function adminGetProducts(params = {}) {
  return api.get('/products', { params }).then((res) => res.data)
}

export function adminGetProduct(idOrSlug) {
  return api.get(`/products/${idOrSlug}`).then((res) => res.data)
}

export function createProduct(payload) {
  return api.post('/products', toFormData(payload)).then((res) => res.data)
}

export function updateProduct(id, payload) {
  const form = toFormData(payload)
  form.append('_method', 'PUT')
  return api.post(`/products/${id}`, form).then((res) => res.data)
}

export function deleteProduct(id) {
  return api.delete(`/products/${id}`).then((res) => res.data)
}

export function duplicateProduct(id) {
  return api.post(`/products/${id}/duplicate`).then((res) => res.data)
}

export function updateProductStatus(id, status) {
  return api.patch(`/products/${id}/status`, { status }).then((res) => res.data)
}

export function deleteProductImage(productId, imageId) {
  return api.delete(`/products/${productId}/images/${imageId}`).then((res) => res.data)
}
