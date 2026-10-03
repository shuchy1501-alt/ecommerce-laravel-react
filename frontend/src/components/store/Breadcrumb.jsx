import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500">
      <Link to="/" className="hover:text-brand-primary">Home</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight size={12} />
          {item.href ? (
            <Link to={item.href} className="hover:text-brand-primary">{item.label}</Link>
          ) : (
            <span className="text-brand-dark" aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
