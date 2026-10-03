import { useRef } from 'react'
import { ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react'
import { reviews } from '@/data/mockReviews'
import RatingStars from './RatingStars'

export default function ReviewsSection() {
  const scrollerRef = useRef(null)

  const scroll = (dir) => {
    scrollerRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between">
        <h2 className="font-brand-display text-3xl font-semibold text-brand-dark sm:text-4xl">What Our Customers Say</h2>
        <div className="hidden gap-2 sm:flex">
          <button onClick={() => scroll(-1)} aria-label="Previous reviews" className="rounded-full border border-brand-border p-2 hover:border-brand-dark">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scroll(1)} aria-label="Next reviews" className="rounded-full border border-brand-border p-2 hover:border-brand-dark">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollerRef} className="mt-8 flex snap-x gap-5 overflow-x-auto pb-2">
        {reviews.map((r) => (
          <div key={r.id} className="w-72 flex-shrink-0 snap-start rounded-xl border border-brand-border p-5">
            <div className="flex items-center gap-3">
              <img src={r.avatar} alt={r.name} className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="text-sm font-semibold text-brand-dark">{r.name}</p>
                <RatingStars rating={r.rating} size={12} />
              </div>
            </div>
            <p className="mt-3 line-clamp-4 text-sm text-gray-600">{r.text}</p>
            {r.verified && (
              <span className="mt-3 flex items-center gap-1 text-xs font-medium text-brand-success">
                <BadgeCheck size={14} /> Verified Purchase
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
