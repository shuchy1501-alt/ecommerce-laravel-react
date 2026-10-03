export default function Pagination({ currentPage = 1, lastPage, total = 0, perPage = 0, onPageChange }) {
  if (!lastPage || lastPage <= 1) return null

  const pages = []
  const windowSize = 1
  for (let p = 1; p <= lastPage; p++) {
    if (p === 1 || p === lastPage || Math.abs(p - currentPage) <= windowSize) {
      pages.push(p)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1
  const to = Math.min(currentPage * perPage, total) || 0

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-stone-light px-4 py-3 sm:flex-row">
      <p className="text-xs text-stone">
        Showing <span className="font-medium text-ink">{from}</span>–<span className="font-medium text-ink">{to}</span> of{' '}
        <span className="font-medium text-ink">{total}</span>
      </p>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-sm px-2.5 py-1.5 text-sm text-ink hover:bg-bone-dim disabled:opacity-30"
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-stone">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === currentPage ? 'page' : undefined}
              className={`min-w-[2rem] rounded-sm px-2.5 py-1.5 text-sm ${
                p === currentPage ? 'bg-oxblood text-bone' : 'text-ink hover:bg-bone-dim'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= lastPage}
          className="rounded-sm px-2.5 py-1.5 text-sm text-ink hover:bg-bone-dim disabled:opacity-30"
        >
          ›
        </button>
      </nav>
    </div>
  )
}
