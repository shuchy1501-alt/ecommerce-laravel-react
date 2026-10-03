import { useState } from 'react'
import { X } from 'lucide-react'

const MESSAGES = [
  'Free shipping on orders over ৳2,000',
  'New Collection 2026 is here',
  'Easy 7-Day Returns',
]

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <div className="relative bg-brand-dark text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center overflow-hidden px-10 py-2 text-center text-xs font-medium tracking-wide sm:text-sm">
        <div className="flex gap-10 whitespace-nowrap sm:hidden">
          <span>{MESSAGES[0]}</span>
        </div>
        <div className="hidden gap-10 sm:flex">
          {MESSAGES.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"
      >
        <X size={14} />
      </button>
    </div>
  )
}
