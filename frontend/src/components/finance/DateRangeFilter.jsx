const PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
]

/* Spec section 29 — shared date-range control for every finance report page. */
export default function DateRangeFilter({ range, dateFrom, dateTo, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={range}
        onChange={(e) => onChange({ range: e.target.value, dateFrom, dateTo })}
        className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
      >
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>

      {range === 'custom' && (
        <>
          <input
            type="date"
            value={dateFrom || ''}
            onChange={(e) => onChange({ range, dateFrom: e.target.value, dateTo })}
            className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
          />
          <span className="text-xs text-stone">to</span>
          <input
            type="date"
            value={dateTo || ''}
            onChange={(e) => onChange({ range, dateFrom, dateTo: e.target.value })}
            className="rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
          />
        </>
      )}
    </div>
  )
}
