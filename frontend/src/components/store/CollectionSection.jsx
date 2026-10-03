import { Link } from 'react-router-dom'
import { collections } from '@/data/mockCategories'

export default function CollectionSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <h2 className="text-center font-brand-display text-3xl font-semibold text-brand-dark sm:text-4xl">Shop By Collection</h2>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {collections.map((c, i) => (
          <Link
            key={c.slug}
            to={`/shop?collection=${c.slug}`}
            className={`group relative block overflow-hidden rounded-xl ${i === 0 ? 'sm:col-span-2 lg:col-span-2 aspect-[16/10]' : 'aspect-[3/4]'}`}
          >
            <img src={c.image} alt={c.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h3 className="font-brand-display text-lg font-semibold text-white">{c.title}</h3>
              <p className="mt-1 text-xs text-white/80">{c.description}</p>
              <span className="mt-2 inline-block text-xs font-semibold tracking-wide text-brand-primary underline-offset-2 group-hover:underline">
                SHOP NOW
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
