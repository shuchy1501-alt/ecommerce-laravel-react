import { NavLink } from 'react-router-dom'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ to: '/admin', label: 'Dashboard' }],
  },
  {
    label: 'Catalog & Sales',
    items: [
      { to: '/admin/categories', label: 'Categories' },
      { to: '/admin/subcategories', label: 'Subcategories' },
      { to: '/admin/brands', label: 'Brands' },
      { to: '/admin/products', label: 'Products' },
      { to: '/admin/orders', label: 'Orders' },
      { to: '/admin/returns', label: 'Returns' },
      { to: '/admin/exchanges', label: 'Exchanges' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/admin/inventory', label: 'Inventory Overview' },
      { to: '/admin/inventory/stock', label: 'Stock' },
      { to: '/admin/suppliers', label: 'Suppliers' },
      { to: '/admin/purchases', label: 'Purchases' },
      { to: '/admin/inventory/movements', label: 'Stock Movements' },
      { to: '/admin/inventory/adjustments', label: 'Stock Adjustments' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/admin/finance', label: 'Financial Dashboard' },
      { to: '/admin/finance/revenue', label: 'Revenue' },
      { to: '/admin/finance/expenses', label: 'Expenses' },
      { to: '/admin/sales', label: 'Sales' },
      { to: '/admin/finance/payments', label: 'Payments' },
      { to: '/admin/refunds', label: 'Refunds' },
      { to: '/admin/finance/profit-loss', label: 'Profit & Loss' },
      { to: '/admin/finance/cash-flow', label: 'Cash Flow' },
      { to: '/admin/finance/transactions', label: 'Financial Transactions' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/users', label: 'Users & Roles' },
      { to: '/admin/settings', label: 'Settings' },
      { to: '/admin/audit-logs', label: 'Audit Log' },
      { to: '/admin/settings/profile', label: 'My Profile' },
    ],
  },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-stone-light bg-bone
          transition-transform duration-200 lg:static lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 items-center border-b border-stone-light px-6">
          <span className="font-display text-lg text-ink">FashionMart</span>
        </div>
        <nav className="scrollbar-thin h-[calc(100%-4rem)] overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="mb-1.5 px-3 font-utility text-[10px] uppercase tracking-widest text-stone">
                {group.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/admin' || item.to === '/admin/inventory' || item.to === '/admin/finance'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `tag-notch block rounded-sm py-2 pl-5 pr-3 text-sm transition-colors ${
                          isActive ? 'bg-ink text-bone' : 'text-ink hover:bg-bone-dim'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
