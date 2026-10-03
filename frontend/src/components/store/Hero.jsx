import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-dark">
      <img
        src="https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=1600&q=80"
        alt="Models wearing the new season FashionMart collection"
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent sm:bg-gradient-to-r" />
      <div className="relative mx-auto flex max-w-7xl flex-col justify-end px-4 py-24 sm:justify-center sm:px-6 sm:py-40 lg:px-8">
        <div className="max-w-lg animate-fm-fade-up">
          <span className="text-xs font-semibold tracking-[0.3em] text-brand-primary">NEW SEASON</span>
          <h1 className="mt-3 font-brand-display text-5xl font-semibold leading-[1.05] text-white sm:text-6xl">
            Define Your Style
          </h1>
          <p className="mt-4 max-w-sm text-sm text-white/80 sm:text-base">
            Discover the latest fashion designed for your everyday confidence.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop?category=men" className="rounded-md bg-brand-primary px-6 py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-brand-primary-dark">
              SHOP MEN
            </Link>
            <Link to="/shop?category=women" className="rounded-md border border-white/60 px-6 py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-white hover:text-brand-dark">
              SHOP WOMEN
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
