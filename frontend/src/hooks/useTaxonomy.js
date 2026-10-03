import { useEffect, useState } from 'react'
import { getActiveCategories } from '@/api/categoryService'
import { getActiveBrands } from '@/api/brandService'

/**
 * Live replacement for the Phase 5 mock category/brand data. Used by the
 * mega menu, mobile menu, homepage category tiles, and shop filters so the
 * storefront navigation updates automatically when an admin adds a
 * category/subcategory/brand (Phase 6 spec section 47).
 */
export function useTaxonomy() {
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([getActiveCategories(), getActiveBrands()])
      .then(([categoriesRes, brandsRes]) => {
        if (!active) return
        setCategories(categoriesRes.data || [])
        setBrands(brandsRes.data || [])
      })
      .catch(() => {
        if (active) {
          setCategories([])
          setBrands([])
        }
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  return { categories, brands, loading }
}
