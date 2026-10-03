import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'

export default function Forbidden() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bone px-4 text-center">
      <span className="font-utility text-xs uppercase tracking-[0.3em] text-stone">Error 403</span>
      <h1 className="mt-2 font-display text-6xl text-ink">Access restricted</h1>
      <p className="mt-3 max-w-sm text-sm text-stone">
        You don't have permission to view this page. Contact an administrator if you believe this is a mistake.
      </p>
      <Button as={Link} to="/" variant="accent" className="mt-6">
        Back to dashboard
      </Button>
    </div>
  )
}
