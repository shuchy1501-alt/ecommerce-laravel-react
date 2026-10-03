import { Link } from 'react-router-dom'
import { useTaxonomy } from '@/hooks/useTaxonomy'

export default function MegaMenu({ onNavigate }) {
  const { categories, loading } = useTaxonomy()

  if (loading || categories.length === 0) return null

  return (
    <div className="absolute left-1/2 top-full z-40 w-screen max-w-4xl -translate-x-1/2 rounded-b-lg border border-t-0 border-brand-border bg-white p-8 shadow-xl">
      <div className="grid grid-cols-5 gap-6">
        {categories.map((category) => (
          <div key={category.id}>
            <Link
              to={`/shop?category=${category.slug}`}
              onClick={onNavigate}
              className="text-xs font-bold uppercase tracking-wider text-brand-primary"
            >
              {category.name}
            </Link>
            <ul className="mt-3 space-y-2">
              {(category.subcategories || []).map((sub) => (
                <li key={sub.id}>
                  <Link
                    to={`/shop?category=${category.slug}&subcategory=${sub.slug}`}
                    onClick={onNavigate}
                    className="text-sm text-gray-600 hover:text-brand-dark"
                  >
                    {sub.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
