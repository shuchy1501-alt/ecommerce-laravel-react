import { useEffect, useState } from 'react'
import api from '@/api/axios'

/** Pings the backend /health endpoint. Used for the Phase 1 smoke test only. */
export default function HealthCheck() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    api
      .get('/health')
      .then(() => setStatus('ok'))
      .catch(() => setStatus('down'))
  }, [])

  const styles = {
    checking: 'bg-bone-dim text-stone',
    ok: 'bg-success/10 text-success',
    down: 'bg-danger/10 text-danger',
  }
  const labels = { checking: 'Checking API…', ok: 'API connected', down: 'API unreachable' }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-utility uppercase tracking-wider ${styles[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  )
}
