import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 py-12">
      <div className="mb-8 text-center">
        <span className="font-display text-3xl tracking-tight text-bone">FashionMart</span>
        <p className="mt-1 font-utility text-[11px] uppercase tracking-[0.2em] text-stone-light">
          Retail &amp; Inventory Console
        </p>
      </div>
      <div className="w-full max-w-md rounded-sm bg-bone p-8 shadow-2xl">
        <Outlet />
      </div>
      <p className="mt-6 text-xs text-stone-light">© {new Date().getFullYear()} FashionMart</p>
    </div>
  )
}
