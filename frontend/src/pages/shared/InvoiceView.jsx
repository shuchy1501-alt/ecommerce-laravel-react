import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Printer, Download } from 'lucide-react'
import * as orderService from '@/api/orderService'
import { useToast } from '@/context/ToastContext'
import { InvoiceSkeleton } from '@/components/ui/Skeleton'

export default function InvoiceView() {
  const { id } = useParams()
  const toast = useToast()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    orderService
      .getInvoice(id)
      .then(({ data }) => setInvoice(data))
      .catch((err) => toast.error(err.message || 'Invoice not available for this order yet.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <InvoiceSkeleton />
      </div>
    )
  }

  if (!invoice) return null

  const order = invoice.order

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex justify-end gap-3 print:hidden">
        <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-md border border-brand-border px-4 py-2 text-sm font-medium text-brand-dark hover:bg-brand-light">
          <Printer size={15} /> Print Invoice
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary-dark">
          <Download size={15} /> Download Invoice
        </button>
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-8 print:border-0 print:p-0">
        <div className="flex items-start justify-between border-b border-brand-border pb-6">
          <div>
            <h1 className="font-brand-display text-2xl font-bold text-brand-dark">FashionMart</h1>
            <p className="mt-1 text-xs text-gray-500">House 12, Road 5, Dhanmondi, Dhaka, Bangladesh</p>
            <p className="text-xs text-gray-500">+880 1XXX-XXXXXX · support@fashionmart.test</p>
          </div>
          <div className="text-right">
            <p className="font-brand-display text-lg font-semibold text-brand-dark">INVOICE</p>
            <p className="text-xs text-gray-500">{invoice.invoice_number}</p>
            <p className="text-xs text-gray-500">{invoice.invoice_date}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 border-b border-brand-border py-6 text-sm">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Bill To</p>
            <p className="font-medium text-brand-dark">{order?.shipping?.name}</p>
            <p className="text-gray-500">{order?.shipping?.phone}</p>
            <p className="text-gray-500">{order?.shipping?.address}</p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Order Details</p>
            <p className="text-gray-600">Order #: <span className="font-medium text-brand-dark">{order?.order_number}</span></p>
            <p className="text-gray-600">Payment: <span className="font-medium capitalize text-brand-dark">{order?.payment_method}</span> · <span className="capitalize">{order?.payment_status}</span></p>
          </div>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="pb-2">Product</th>
              <th className="pb-2">SKU</th>
              <th className="pb-2">Variant</th>
              <th className="pb-2 text-right">Qty</th>
              <th className="pb-2 text-right">Unit Price</th>
              <th className="pb-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order?.items?.map((item) => (
              <tr key={item.id} className="border-b border-brand-border/60">
                <td className="py-2 text-brand-dark">{item.product_name}</td>
                <td className="py-2 text-gray-500">{item.sku}</td>
                <td className="py-2 text-gray-500">{[item.color, item.size].filter(Boolean).join(' / ') || '—'}</td>
                <td className="py-2 text-right text-brand-dark">{item.quantity}</td>
                <td className="py-2 text-right text-brand-dark">৳{Number(item.unit_price).toLocaleString()}</td>
                <td className="py-2 text-right text-brand-dark">৳{Number(item.subtotal).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-6 w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="text-brand-dark">৳{Number(invoice.subtotal).toLocaleString()}</span></div>
          {invoice.discount > 0 && <div className="flex justify-between text-brand-success"><span>Discount</span><span>-৳{Number(invoice.discount).toLocaleString()}</span></div>}
          <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="text-brand-dark">৳{Number(invoice.shipping).toLocaleString()}</span></div>
          <div className="flex justify-between text-gray-600"><span>Tax</span><span className="text-brand-dark">৳{Number(invoice.tax).toLocaleString()}</span></div>
          <div className="flex justify-between border-t border-brand-dark pt-1.5 text-base font-bold text-brand-dark"><span>Grand Total</span><span>৳{Number(invoice.total).toLocaleString()}</span></div>
        </div>

        <p className="mt-10 text-center text-xs text-gray-400">Thank you for shopping with FashionMart.</p>
      </div>
    </div>
  )
}
