export const money = (v) => `৳${Number(v || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/* Spec section 40 — professional KPI card used across all finance pages. */
export default function KpiCard({ label, value, toneClass = 'text-ink', sub }) {
  return (
    <div className="rounded-sm border border-stone-light bg-white p-5">
      <p className="font-utility text-[11px] uppercase tracking-wider text-stone">{label}</p>
      <p className={`mt-2 font-display text-2xl ${toneClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-stone">{sub}</p>}
    </div>
  )
}
