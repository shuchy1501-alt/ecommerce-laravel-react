import { useEffect, useRef, useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { globalSearch } from '@/api/searchService'

/**
 * Phase 13D — admin global search. Debounced, server-side (see
 * SearchService on the backend — never fetches full datasets), and
 * permission-aware: the backend only returns sections the caller has the
 * matching permission for, so this component doesn't need its own
 * category-visibility logic, it just renders whatever comes back.
 */
export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const [sections, setSections] = useState({})
  const [loading, setLoading] = useState(false)
  const rootRef = useRef(null)
  const debounceRef = useRef(null)
  const navigate = useNavigate()

  const runSearch = useCallback((q) => {
    if (q.trim().length < 2) {
      setSections({})
      return
    }
    setLoading(true)
    globalSearch(q)
      .then((res) => setSections(res.data || {}))
      .catch(() => setSections({}))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(term), 300)
    return () => clearTimeout(debounceRef.current)
  }, [term, runSearch])

  useEffect(() => {
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleSelect = (path) => {
    setOpen(false)
    setTerm('')
    setSections({})
    navigate(path)
  }

  const hasResults = Object.keys(sections).length > 0

  return (
    <div className="relative w-full max-w-xs" ref={rootRef}>
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search products, orders, customers…"
          className="w-full rounded-sm border border-stone-light bg-white py-2 pl-8 pr-8 text-sm text-ink placeholder:text-ink/40 focus:border-oxblood focus:outline-none"
        />
        {term && (
          <button
            onClick={() => {
              setTerm('')
              setSections({})
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && term.trim().length >= 2 && (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-[70vh] w-[28rem] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-stone-light bg-white shadow-lg">
          {loading && <p className="px-4 py-6 text-center text-sm text-stone">Searching…</p>}

          {!loading && !hasResults && (
            <p className="px-4 py-6 text-center text-sm text-stone">No results for "{term}".</p>
          )}

          {!loading &&
            Object.entries(sections).map(([type, section]) => (
              <div key={type} className="border-b border-stone-light py-2 last:border-b-0">
                <p className="px-4 pb-1 text-[11px] font-utility uppercase tracking-wider text-stone">{section.label}</p>
                {section.results.map((r) => (
                  <button
                    key={`${type}-${r.id}`}
                    onClick={() => handleSelect(r.path)}
                    className="flex w-full flex-col items-start gap-0.5 px-4 py-2 text-left hover:bg-bone-dim"
                  >
                    <span className="text-sm font-medium text-ink">{r.title}</span>
                    {r.subtitle && <span className="text-xs text-stone">{r.subtitle}</span>}
                  </button>
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
