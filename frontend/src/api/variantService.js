import api from './axios'

export function getVariants(productId) {
  return api.get(`/products/${productId}/variants`).then((res) => res.data)
}

export function createVariant(productId, payload) {
  return api.post(`/products/${productId}/variants`, payload).then((res) => res.data)
}

export function updateVariant(productId, variantId, payload) {
  return api.put(`/products/${productId}/variants/${variantId}`, payload).then((res) => res.data)
}

export function deleteVariant(productId, variantId) {
  return api.delete(`/products/${productId}/variants/${variantId}`).then((res) => res.data)
}

/**
 * Given { sizes: [...], colors: [...] }, asks the backend to generate every
 * combination pre-filled with a suggested SKU/price, skipping combos that
 * already exist on the product. Nothing is persisted until the admin saves
 * the product form.
 */
export function generateVariantCombinations(productId, { sizes, colors }) {
  return api.post(`/products/${productId}/variants/generate`, { sizes, colors }).then((res) => res.data)
}
