import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bone px-4 text-center">
      <span className="font-utility text-xs uppercase tracking-[0.3em] text-stone">Error 404</span>
      <h1 className="mt-2 font-display text-6xl text-ink">Page not found</h1>
      <p className="mt-3 max-w-sm text-sm text-stone">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Button as={Link} to="/" variant="accent" className="mt-6">
        Back to dashboard
      </Button>
    </div>
  )
}
