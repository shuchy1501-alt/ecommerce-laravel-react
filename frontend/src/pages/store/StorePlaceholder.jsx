import { Link } from 'react-router-dom'
import Breadcrumb from '@/components/store/Breadcrumb'

// Lightweight placeholder for informational/account pages that are linked
// from the footer and account menu but are out of scope for Phase 5
// (they depend on backend content/order APIs from a later phase).
export default function StorePlaceholder({ title, description }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <Breadcrumb items={[{ label: title }]} />
      <h1 className="mt-4 font-brand-display text-3xl font-semibold text-brand-dark">{title}</h1>
      <p className="mt-3 text-sm text-gray-500">
        {description || "This page is coming soon. We're putting the finishing touches on it."}
      </p>
      <Link to="/" className="mt-6 inline-block rounded-md bg-brand-primary px-6 py-3 text-sm font-semibold text-white hover:bg-brand-primary-dark">
        BACK TO HOME
      </Link>
    </div>
  )
}
