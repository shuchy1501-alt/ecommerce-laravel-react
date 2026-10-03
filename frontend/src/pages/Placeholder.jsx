import Badge from '@/components/ui/Badge'

/** Generic placeholder for routes whose business modules ship in later phases. */
export default function Placeholder({ title }) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">{title}</h1>
        <Badge tone="neutral">Coming in a later phase</Badge>
      </div>
      <div className="rounded-sm border border-dashed border-stone-light bg-white p-10 text-center text-sm text-stone">
        The {title.toLowerCase()} module will be built in its dedicated phase.
      </div>
    </div>
  )
}
