import { Link } from 'react-router-dom'
import { Facebook, Instagram, Youtube } from 'lucide-react'

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { label: 'Men', href: '/shop?category=men' },
      { label: 'Women', href: '/shop?category=women' },
      { label: 'Kids', href: '/shop?category=kids' },
      { label: 'New Arrivals', href: '/shop?sort=newest' },
      { label: 'Sale', href: '/shop?sort=featured&sale=1' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Track Order', href: '/account' },
      { label: 'Returns & Exchanges', href: '/returns' },
      { label: 'Shipping Info', href: '/shipping' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'FAQs', href: '/faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About FashionMart', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
]

export default function PublicFooter() {
  return (
    <footer className="border-t border-brand-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-2">
            <Link to="/" className="font-brand-display text-2xl font-bold tracking-tight text-brand-dark">
              FASHIONMART
            </Link>
            <p className="mt-3 max-w-xs text-sm text-gray-500">Style That Defines You.</p>
            <div className="mt-5 flex gap-3">
              {[Facebook, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social link"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-border text-brand-dark transition-colors hover:border-brand-primary hover:text-brand-primary"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-brand-dark">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.href} className="text-sm text-gray-500 hover:text-brand-primary">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-brand-border pt-6 text-xs text-gray-400 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} FashionMart. All rights reserved.</p>
          <p>Secure payments · Cash on delivery available</p>
        </div>
      </div>
    </footer>
  )
}
