import Button from '@/components/ui/Button'

export default function ServerError({ onRetry }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bone px-4 text-center">
      <span className="font-utility text-xs uppercase tracking-[0.3em] text-stone">Error 500</span>
      <h1 className="mt-2 font-display text-6xl text-ink">Something broke</h1>
      <p className="mt-3 max-w-sm text-sm text-stone">
        An unexpected error occurred while rendering this page. Try reloading — if it keeps happening, contact support.
      </p>
      <Button onClick={onRetry || (() => window.location.reload())} variant="accent" className="mt-6">
        Reload page
      </Button>
    </div>
  )
}
