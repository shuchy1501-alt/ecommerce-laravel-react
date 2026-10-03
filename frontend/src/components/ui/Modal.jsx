import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`relative w-full ${sizes[size]} rounded-sm bg-bone shadow-2xl animate-[fadeIn_150ms_ease-out]`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-stone-light px-6 py-4">
            <h2 id="modal-title" className="font-display text-lg text-ink">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-stone hover:text-ink text-xl leading-none"
            >
              &times;
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-stone-light px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
