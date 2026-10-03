import { Star } from 'lucide-react'

export default function RatingStars({ rating = 0, reviewCount, size = 14 }) {
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`Rated ${rating} out of 5`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            className={n <= Math.round(rating) ? 'fill-brand-primary text-brand-primary' : 'fill-transparent text-brand-border'}
          />
        ))}
      </div>
      {reviewCount != null && <span className="text-xs text-gray-500">({reviewCount})</span>}
    </div>
  )
}
