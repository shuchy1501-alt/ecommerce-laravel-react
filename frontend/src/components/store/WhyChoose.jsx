import { Truck, ShieldCheck, RotateCcw, BadgeCheck } from 'lucide-react'

const FEATURES = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over ৳2,000' },
  { icon: ShieldCheck, title: 'Secure Payment', desc: '100% secure checkout' },
  { icon: RotateCcw, title: 'Easy Returns', desc: '7-day return policy' },
  { icon: BadgeCheck, title: 'Authentic Products', desc: 'Quality guaranteed' },
]

export default function WhyChoose() {
  return (
    <section className="border-y border-brand-border bg-brand-light">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <f.icon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-brand-dark">{f.title}</h3>
              <p className="mt-0.5 text-xs text-gray-500">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
