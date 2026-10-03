import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/context/ToastContext'
import { getSupplier } from '@/api/supplierService'

const money = (v) => `৳${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`

export default function SupplierDetails() {
  const { id } = useParams()
  const toast = useToast?.()
  const [supplier, setSupplier] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getSupplier(id)
      .then((res) => {
        setSupplier(res.data.supplier)
        setHistory(res.data.purchase_history || [])
      })
      .catch((err) => toast?.error?.(err.message || 'Failed to load supplier.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="h-64 animate-pulse rounded-sm bg-bone-dim" />
  if (!supplier) return null

  const summary = supplier.purchase_summary || {}

  return (
    <div>
      <Link to="/admin/suppliers" className="mb-4 inline-block text-xs font-medium text-oxblood hover:underline">
        ← Back to Suppliers
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink">{supplier.name}</h1>
          <p className="text-sm text-stone">{supplier.company_name}</p>
        </div>
        <Badge tone={supplier.status ? 'success' : 'neutral'}>{supplier.status ? 'Active' : 'Inactive'}</Badge>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-sm border border-stone-light bg-white p-5 lg:col-span-1">
          <h2 className="mb-3 font-display text-base text-ink">Supplier Information</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-stone">Contact Person</dt><dd className="text-ink">{supplier.contact_person || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-stone">Phone</dt><dd className="text-ink">{supplier.phone || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-stone">Email</dt><dd className="text-ink">{supplier.email || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-stone">Tax / Business ID</dt><dd className="text-ink">{supplier.tax_id || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-stone">City</dt><dd className="text-ink">{supplier.city || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-stone">Country</dt><dd className="text-ink">{supplier.country || '—'}</dd></div>
            <div><dt className="mb-1 text-stone">Address</dt><dd className="text-ink">{supplier.address || '—'}</dd></div>
            {supplier.notes && <div><dt className="mb-1 text-stone">Notes</dt><dd className="text-ink">{supplier.notes}</dd></div>}
          </dl>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-2 lg:content-start">
          <div className="rounded-sm border border-stone-light bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-stone">Total Purchases</p>
            <p className="mt-1 font-display text-xl text-ink">{summary.total_purchases ?? 0}</p>
          </div>
          <div className="rounded-sm border border-stone-light bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-stone">Total Purchase Amount</p>
            <p className="mt-1 font-display text-xl text-ink">{money(summary.total_purchase_amount)}</p>
          </div>
          <div className="rounded-sm border border-stone-light bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-stone">Last Purchase</p>
            <p className="mt-1 font-display text-xl text-ink">{summary.last_purchase_date || '—'}</p>
          </div>
        </div>
      </div>

      <h2 className="mb-3 font-display text-lg text-ink">Purchase History</h2>
      <div className="overflow-x-auto rounded-sm border border-stone-light bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-stone-light bg-bone-dim/60 text-[11px] uppercase tracking-wider text-stone">
              <th className="px-4 py-3 font-utility">Purchase #</th>
              <th className="px-4 py-3 font-utility">Date</th>
              <th className="px-4 py-3 font-utility">Items</th>
              <th className="px-4 py-3 font-utility">Amount</th>
              <th className="px-4 py-3 font-utility">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-stone">No purchases yet.</td>
              </tr>
            )}
            {history.map((p) => (
              <tr key={p.id} className="border-b border-stone-light last:border-0">
                <td className="px-4 py-3">
                  <Link to={`/admin/purchases/${p.id}`} className="text-ink hover:underline">{p.purchase_number}</Link>
                </td>
                <td className="px-4 py-3 text-stone">{p.purchase_date}</td>
                <td className="px-4 py-3 text-stone">{p.items_count}</td>
                <td className="px-4 py-3 text-ink">{money(p.total)}</td>
                <td className="px-4 py-3">
                  <Badge tone={p.status === 'received' ? 'success' : p.status === 'cancelled' ? 'danger' : 'warning'}>
                    {p.status.replace('_', ' ')}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
