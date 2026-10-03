import { Link, Outlet } from 'react-router-dom'

export default function PublicAuthLayout() {
  return (
    <div className="storefront grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80"
          alt="FashionMart style"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-brand-dark/10 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <span className="text-xs font-semibold tracking-[0.3em] text-brand-primary">FASHIONMART</span>
          <h2 className="mt-2 font-brand-display text-3xl font-semibold">Style That Defines You</h2>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="font-brand-display text-2xl font-bold text-brand-dark lg:hidden">FASHIONMART</Link>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
