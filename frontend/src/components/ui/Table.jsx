/**
 * Generic table.
 * columns: [{ key, header, render?(row), className? }]
 * rows: array of data objects
 */
export default function Table({ columns, rows, keyField = 'id', emptyMessage = 'No records found.', loading = false }) {
  return (
    <div className="w-full overflow-x-auto rounded-sm border border-stone-light bg-white scrollbar-thin">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-stone-light bg-bone-dim/60">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 font-utility text-[11px] uppercase tracking-wider text-stone"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`skeleton-${i}`} className="border-b border-stone-light/60 last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-bone-dim" />
                  </td>
                ))}
              </tr>
            ))}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-stone">
                {emptyMessage}
              </td>
            </tr>
          )}

          {!loading &&
            rows.map((row) => (
              <tr key={row[keyField]} className="border-b border-stone-light/60 last:border-0 hover:bg-bone/60">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-ink ${col.className || ''}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
