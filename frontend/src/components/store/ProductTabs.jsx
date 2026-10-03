import { useState } from 'react'
import { BadgeCheck } from 'lucide-react'
import { reviews } from '@/data/mockReviews'
import RatingStars from './RatingStars'

const TABS = ['Description', 'Specifications', 'Shipping & Returns', 'Reviews']

export default function ProductTabs({ product }) {
  const [active, setActive] = useState('Description')

  return (
    <div className="mt-14">
      <div className="flex gap-6 overflow-x-auto border-b border-brand-border" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={active === t}
            onClick={() => setActive(t)}
            className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              active === t ? 'border-brand-primary text-brand-dark' : 'border-transparent text-gray-500 hover:text-brand-dark'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="py-6" role="tabpanel">
        {active === 'Description' && <p className="max-w-2xl text-sm leading-relaxed text-gray-600">{product.description}</p>}

        {active === 'Specifications' && (
          <dl className="grid max-w-md grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {Object.entries(product.specifications).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-brand-border pb-2 text-sm sm:block sm:border-none sm:pb-0">
                <dt className="text-gray-500">{k}</dt>
                <dd className="font-medium text-brand-dark">{v}</dd>
              </div>
            ))}
          </dl>
        )}

        {active === 'Shipping & Returns' && (
          <ul className="max-w-md space-y-2 text-sm text-gray-600">
            <li>Free shipping on orders over ৳2,000.</li>
            <li>Standard delivery in 2–5 business days across Bangladesh.</li>
            <li>7-day easy return policy on unworn items with tags attached.</li>
            <li>Cash on delivery available nationwide.</li>
          </ul>
        )}

        {active === 'Reviews' && (
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <RatingStars rating={product.rating} size={18} />
              <span className="text-sm text-gray-500">Based on {product.reviewCount} reviews</span>
            </div>
            <div className="mt-5 space-y-5">
              {reviews.slice(0, 3).map((r) => (
                <div key={r.id} className="border-b border-brand-border pb-5">
                  <div className="flex items-center gap-3">
                    <img src={r.avatar} alt={r.name} className="h-9 w-9 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-semibold text-brand-dark">{r.name}</p>
                      <RatingStars rating={r.rating} size={12} />
                    </div>
                    {r.verified && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-brand-success">
                        <BadgeCheck size={13} /> Verified
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
