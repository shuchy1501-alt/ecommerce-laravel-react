export function SkeletonLine({ className = '' }) {
  return <div className={`animate-pulse rounded bg-bone-dim ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="rounded-sm border border-stone-light bg-white p-4">
      <SkeletonLine className="mb-3 h-4 w-1/3" />
      <SkeletonLine className="mb-2 h-3 w-full" />
      <SkeletonLine className="h-3 w-2/3" />
    </div>
  )
}

export function SkeletonStatGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-sm border border-stone-light bg-white p-4">
          <SkeletonLine className="mb-3 h-3 w-1/2" />
          <SkeletonLine className="h-6 w-2/3" />
        </div>
      ))}
    </div>
  )
}

/** Generic admin table skeleton — columns/rows configurable per page. */
function TableSkeleton({ columns = 6, rows = 8 }) {
  return (
    <div className="overflow-hidden rounded-sm border border-stone-light bg-white">
      <div className="flex gap-4 border-b border-stone-light px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonLine key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-stone-light px-4 py-3 last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <SkeletonLine key={c} className={`h-4 flex-1 ${c === 0 ? 'max-w-10' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ProductTableSkeleton() {
  return <TableSkeleton columns={10} rows={8} />
}

export function CategoryTableSkeleton() {
  return <TableSkeleton columns={8} rows={6} />
}

export function BrandTableSkeleton() {
  return <TableSkeleton columns={6} rows={6} />
}

/** Customer account: profile page (header + stacked field rows). */
export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-sm border border-stone-light bg-white p-6">
        <div className="h-20 w-20 animate-pulse rounded-full bg-bone-dim" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-4 w-1/3" />
          <SkeletonLine className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-4 rounded-sm border border-stone-light bg-white p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <SkeletonLine className="mb-2 h-3 w-1/4" />
            <SkeletonLine className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Customer account: address book cards. */
export function AddressSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-sm border border-stone-light bg-white p-5">
          <SkeletonLine className="mb-3 h-3 w-1/4" />
          <SkeletonLine className="mb-2 h-4 w-2/3" />
          <SkeletonLine className="mb-2 h-3 w-1/2" />
          <SkeletonLine className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  )
}

/** Customer account: wishlist product rows. */
export function WishlistSkeleton({ count = 3 }) {
  return (
    <div className="divide-y divide-stone-light border-y border-stone-light">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 py-5">
          <div className="h-28 w-24 flex-shrink-0 animate-pulse rounded-md bg-bone-dim" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="h-3 w-1/4" />
            <SkeletonLine className="h-4 w-2/3" />
            <SkeletonLine className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Order list: rows of order summaries. */
export function OrderListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-xl border border-stone-light bg-white p-4">
          <div className="space-y-2">
            <SkeletonLine className="h-3 w-32" />
            <SkeletonLine className="h-3 w-24" />
          </div>
          <SkeletonLine className="h-6 w-20" />
        </div>
      ))}
    </div>
  )
}

/** Order detail: timeline + items + summary. */
export function OrderDetailsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <SkeletonLine className="h-5 w-1/3" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonLine key={i} className="h-16 w-full" />
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-stone-light bg-white p-5">
        <SkeletonLine className="h-4 w-1/2" />
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLine key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  )
}

/** Printable invoice shell. */
export function InvoiceSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border border-stone-light bg-white p-8">
      <SkeletonLine className="h-6 w-1/3" />
      <SkeletonLine className="h-3 w-1/2" />
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonLine key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}

/** Payment method / confirmation step. */
export function PaymentSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <SkeletonLine key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

/** Cart page: item rows + summary card. */
export function CartSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      <div className="divide-y divide-stone-light border-y border-stone-light">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-4 py-5">
            <div className="h-24 w-20 flex-shrink-0 animate-pulse rounded-md bg-bone-dim" />
            <div className="flex-1 space-y-2">
              <SkeletonLine className="h-3 w-1/2" />
              <SkeletonLine className="h-3 w-1/3" />
              <SkeletonLine className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-fit space-y-3 rounded-lg border border-stone-light p-5">
        <SkeletonLine className="h-4 w-1/2" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonLine key={i} className="h-3 w-full" />
        ))}
        <SkeletonLine className="h-10 w-full" />
      </div>
    </div>
  )
}

/** Checkout shipping-method / generic step list. */
export function ShippingSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonLine key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

/** Checkout step shell: progress bar + content block. */
export function CheckoutSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-9 animate-pulse rounded-full bg-bone-dim" />
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-stone-light bg-white p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLine key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  )
}

/** Mirrors the tabbed section layout of the product create/edit form. */
export function ProductFormSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex gap-2 lg:w-48 lg:flex-col">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonLine key={i} className="h-9 w-full lg:w-full" />
        ))}
      </div>
      <div className="flex-1 space-y-4 rounded-sm border border-stone-light bg-white p-6">
        <SkeletonLine className="h-4 w-1/4" />
        <SkeletonLine className="h-10 w-full" />
        <SkeletonLine className="h-4 w-1/3" />
        <SkeletonLine className="h-10 w-full" />
        <SkeletonLine className="h-24 w-full" />
      </div>
    </div>
  )
}
