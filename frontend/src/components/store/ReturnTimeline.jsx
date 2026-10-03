import { Check, X } from 'lucide-react'

/* Spec section 54 — responsive vertical timeline for a return/exchange/refund request. */

const RETURN_STEPS = ['requested', 'approved', 'received', 'inspected', 'refund_pending', 'refunded', 'completed']
const EXCHANGE_STEPS = ['requested', 'approved', 'received', 'inspected', 'exchange_processing', 'exchange_completed', 'completed']

const LABELS = {
  requested: 'Request Submitted',
  approved: 'Approved',
  pickup_scheduled: 'Pickup Scheduled',
  in_transit: 'In Transit',
  received: 'Received at Warehouse',
  inspected: 'Inspected',
  refund_pending: 'Refund Processing',
  refunded: 'Refund Completed',
  exchange_processing: 'Exchange Processing',
  exchange_completed: 'Replacement Shipped',
  completed: 'Completed',
}

export default function ReturnTimeline({ status, type = 'return' }) {
  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-brand-danger">
        <X size={16} /> This request was rejected.
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className="rounded-md border border-brand-border bg-brand-light px-4 py-3 text-sm font-medium text-gray-600">
        This request was cancelled.
      </div>
    )
  }

  const steps = type === 'exchange' ? EXCHANGE_STEPS : RETURN_STEPS
  // pickup_scheduled/in_transit are optional logistics sub-states between approved and received.
  const effectiveStatus = ['pickup_scheduled', 'in_transit'].includes(status) ? 'approved' : status
  const currentIndex = steps.indexOf(effectiveStatus)

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const done = i <= currentIndex
        const isLast = i === steps.length - 1
        return (
          <div key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done ? 'bg-brand-success text-white' : 'border-2 border-brand-border text-gray-300'
                }`}
              >
                {done ? <Check size={14} /> : ''}
              </div>
              {!isLast && <div className={`w-0.5 flex-1 ${i < currentIndex ? 'bg-brand-success' : 'bg-brand-border'}`} style={{ minHeight: '28px' }} />}
            </div>
            <div className={`pb-7 text-sm ${done ? 'font-medium text-brand-dark' : 'text-gray-400'}`}>{LABELS[step]}</div>
          </div>
        )
      })}
    </div>
  )
}
