import { useEffect, useState } from 'react'
import Hero from '@/components/store/Hero'
import CategorySection from '@/components/store/CategorySection'
import ProductSection from '@/components/store/ProductSection'
import PromoBanner from '@/components/store/PromoBanner'
import CollectionSection from '@/components/store/CollectionSection'
import WhyChoose from '@/components/store/WhyChoose'
import ReviewsSection from '@/components/store/ReviewsSection'
import { ProductGridSkeleton } from '@/components/store/ProductGrid'
import { getProducts } from '@/api/productService'
import { useToast } from '@/context/ToastContext'

export default function Home() {
  const [products, setProducts] = useState(null)
  const [error, setError] = useState(false)
  const toast = useToast()

  useEffect(() => {
    let active = true
    getProducts({ per_page: 40 })
      .then((res) => {
        if (active) setProducts(res.data ?? res)
      })
      .catch(() => {
        if (active) {
          setError(true)
          toast.error('Unable to load products. Please try again.')
        }
      })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const newArrivals = products?.filter((p) => p.badges?.includes('new')) ?? []
  const bestSellers = products?.filter((p) => p.badges?.includes('best-seller')) ?? []
  const trending = products?.slice().reverse() ?? []

  return (
    <div>
      <Hero />
      <CategorySection />

      {products === null && !error ? (
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <ProductGridSkeleton count={4} />
        </div>
      ) : (
        <>
          <ProductSection
            title="New Arrivals"
            subtitle="Fresh styles just landed."
            products={(newArrivals.length ? newArrivals : products.slice(0, 8))}
            viewAllHref="/shop?sort=newest"
          />

          <PromoBanner />

          <ProductSection
            title="Best Sellers"
            products={(bestSellers.length ? bestSellers : products.slice(0, 8))}
            viewAllHref="/shop?sort=best_selling"
          />

          <ProductSection
            title="Trending Now"
            products={trending.slice(0, 8)}
            viewAllHref="/shop"
          />
        </>
      )}

      <CollectionSection />
      <WhyChoose />
      <ReviewsSection />
    </div>
  )
}
