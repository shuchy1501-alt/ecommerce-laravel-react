import { useState } from 'react'
import { useToast } from '@/context/ToastContext'

const OPTIONS = [
  { key: 'email_preferences', label: 'Email Preferences', description: 'Receive account and promotional emails.' },
  { key: 'marketing_notifications', label: 'Marketing Notifications', description: 'New arrivals, sales, and offers.' },
  { key: 'order_notifications', label: 'Order Notifications', description: 'Updates about your order status.' },
]

export default function AccountSettings() {
  const toast = useToast()
  // Notification settings aren't backed by an API yet — this is UI
  // architecture only, per the Phase 7 spec, ready to wire up later.
  const [values, setValues] = useState({
    email_preferences: true,
    marketing_notifications: false,
    order_notifications: true,
  })

  const toggle = (key) => {
    setValues((v) => ({ ...v, [key]: !v[key] }))
    toast.info('Setting saved locally — full sync is coming soon.')
  }

  return (
    <div className="space-y-6">
      <h1 className="font-brand-display text-2xl font-semibold text-brand-dark">Settings</h1>

      <div className="divide-y divide-brand-border rounded-xl border border-brand-border bg-white">
        {OPTIONS.map((opt) => (
          <div key={opt.key} className="flex items-center justify-between gap-4 px-6 py-4">
            <div>
              <p className="text-sm font-medium text-brand-dark">{opt.label}</p>
              <p className="text-xs text-gray-500">{opt.description}</p>
            </div>
            <button
              role="switch"
              aria-checked={values[opt.key]}
              onClick={() => toggle(opt.key)}
              className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
                values[opt.key] ? 'bg-brand-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  values[opt.key] ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
