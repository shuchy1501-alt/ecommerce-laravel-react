import { useEffect, useState } from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { fetchAuditLogs } from '@/api/auditLogService'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

/**
 * Phase 13D — read-only audit trail. There is deliberately no edit/delete
 * affordance anywhere on this page: audit logs are append-only.
 */
const ACTIONS = [
  '', 'auth.login', 'auth.logout',
  'product.created', 'product.updated', 'product.deleted',
  'order.status_changed', 'purchase.received', 'stock.adjusted',
  'return.approved', 'refund.processed', 'exchange.processed',
  'expense.created', 'settings.updated',
]

function actionTone(action) {
  if (action.includes('deleted')) return 'danger'
  if (action.includes('created') || action.includes('approved')) return 'success'
  if (action.includes('login')) return 'accent'
  return 'neutral'
}

export default function AuditLogs() {
  const { can } = useAuth()
  const toast = useToast()
  const [logs, setLogs] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const canView = can('audit_logs.view')

  useEffect(() => {
    if (!canView) return
    setLoading(true)
    fetchAuditLogs({ page, action: action || undefined, per_page: 25 })
      .then((res) => {
        setLogs(res.data || [])
        setMeta(res.meta || null)
      })
      .catch((err) => toast.error(err.message || 'Failed to load audit logs.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, action, canView])

  if (!canView) {
    return (
      <div className="rounded-sm border border-stone-light bg-white p-8 text-center">
        <p className="text-sm text-stone">You don't have permission to view the audit log.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Audit Log</h1>
        <p className="text-sm text-stone">A read-only trail of security-relevant actions across the store.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={action}
          onChange={(e) => {
            setPage(1)
            setAction(e.target.value)
          }}
          className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink"
        >
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a === '' ? 'All actions' : a}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-light bg-bone-dim text-xs font-utility uppercase tracking-wider text-stone">
            <tr>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone">
                  Loading…
                </td>
              </tr>
            )}

            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone">
                  No audit log entries found.
                </td>
              </tr>
            )}

            {!loading &&
              logs.map((log) => (
                <>
                  <tr key={log.id} className="border-b border-stone-light last:border-b-0">
                    <td className="px-4 py-3">
                      <Badge tone={actionTone(log.action)}>{log.action}</Badge>
                    </td>
                    <td className="px-4 py-3">{log.user?.name || <span className="text-stone">System</span>}</td>
                    <td className="px-4 py-3 text-stone">
                      {log.entity_type ? `${log.entity_type}${log.entity_id ? ` #${log.entity_id}` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-stone">{log.ip_address || '—'}</td>
                    <td className="px-4 py-3 text-stone">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      {(log.old_data || log.new_data) && (
                        <button
                          onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                          className="text-xs font-medium text-oxblood hover:underline"
                        >
                          {expanded === log.id ? 'Hide' : 'Details'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === log.id && (
                    <tr className="border-b border-stone-light bg-bone-dim/50 last:border-b-0">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {log.old_data && (
                            <div>
                              <p className="mb-1 text-xs font-utility uppercase tracking-wider text-stone">Before</p>
                              <pre className="overflow-x-auto rounded-sm bg-white p-2 text-xs text-ink">
                                {JSON.stringify(log.old_data, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.new_data && (
                            <div>
                              <p className="mb-1 text-xs font-utility uppercase tracking-wider text-stone">After</p>
                              <pre className="overflow-x-auto rounded-sm bg-white p-2 text-xs text-ink">
                                {JSON.stringify(log.new_data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
          </tbody>
        </table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone">
            Page {meta.current_page} of {meta.last_page} ({meta.total} entries)
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="secondary" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
