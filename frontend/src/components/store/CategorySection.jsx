import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useTaxonomy } from '@/hooks/useTaxonomy'

const FALLBACK_IMAGE = 'https://placehold.co/600x800?text=FashionMart'

export default function CategorySection() {
  const { categories, loading } = useTaxonomy()

  if (!loading && categories.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <h2 className="text-center font-brand-display text-3xl font-semibold text-brand-dark sm:text-4xl">Shop By Category</h2>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-6">
        {categories.map((cat) => (
          <Link key={cat.id} to={`/shop?category=${cat.slug}`} className="group relative block overflow-hidden rounded-lg aspect-[3/4]">
            <img
              src={cat.image_url || FALLBACK_IMAGE}
              alt={cat.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition-opacity group-hover:from-black/80" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3">
              <span className="text-sm font-semibold text-white">{cat.name}</span>
              <ArrowRight size={16} className="text-white transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
