import { Check } from 'lucide-react'

const STEPS = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered']
const LABELS = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
}

export default function OrderTimeline({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-brand-danger">
        This order was cancelled.
      </div>
    )
  }

  const currentIndex = STEPS.indexOf(status)

  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex
        const isLast = i === STEPS.length - 1
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
