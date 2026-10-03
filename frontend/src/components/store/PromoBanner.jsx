import { Link } from 'react-router-dom'

export default function PromoBanner() {
  return (
    <section className="relative mx-auto max-w-7xl overflow-hidden px-4 sm:px-6 lg:px-8">
      <div className="relative isolate flex min-h-[280px] items-center overflow-hidden rounded-2xl bg-brand-primary sm:min-h-[340px]">
        <img
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&q=80"
          alt="Summer style sale"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="relative z-10 px-8 py-10 sm:px-16">
          <span className="text-xs font-bold tracking-[0.3em] text-white">UP TO 40% OFF</span>
          <h2 className="mt-3 font-brand-display text-4xl font-semibold text-white sm:text-5xl">Summer Style Sale</h2>
          <Link
            to="/shop?sale=1"
            className="mt-6 inline-block rounded-md bg-brand-dark px-7 py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-black"
          >
            SHOP SALE
          </Link>
        </div>
      </div>
    </section>
  )
}
