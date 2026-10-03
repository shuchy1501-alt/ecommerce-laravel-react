const toneStyles = {
  success: 'border-success/30 bg-white text-ink before:bg-success',
  error: 'border-danger/30 bg-white text-ink before:bg-danger',
  warning: 'border-gold/30 bg-white text-ink before:bg-gold',
  info: 'border-stone-light bg-white text-ink before:bg-ink',
}

export default function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`relative overflow-hidden rounded-sm border px-4 py-3 pl-5 text-sm shadow-lg before:absolute before:left-0 before:top-0 before:h-full before:w-1 ${toneStyles[t.type]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <p>{t.message}</p>
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
              className="text-stone hover:text-ink"
            >
              &times;
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
