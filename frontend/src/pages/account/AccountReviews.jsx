import { Star } from 'lucide-react'

// Placeholder only — full review system is a future phase.
export default function AccountReviews() {
  return (
    <div className="space-y-6">
      <h1 className="font-brand-display text-2xl font-semibold text-brand-dark">My Reviews</h1>
      <div className="rounded-xl border border-dashed border-brand-border bg-white px-6 py-16 text-center">
        <Star size={36} className="mx-auto text-brand-border" />
        <p className="mt-3 text-sm text-gray-500">You haven't written any reviews yet.</p>
        <p className="mt-1 text-xs text-gray-400">Reviews you leave on products will appear here.</p>
      </div>
    </div>
  )
}
