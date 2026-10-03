export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-stone-light bg-white px-6 py-16 text-center">
      <div className="mb-3 h-10 w-10 rounded-full border border-stone-light" aria-hidden="true" />
      <h3 className="font-display text-lg text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-stone">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
