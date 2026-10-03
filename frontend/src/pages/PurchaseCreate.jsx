import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useToast } from '@/context/ToastContext'
import { getActiveSuppliers } from '@/api/supplierService'
import { createPurchase } from '@/api/purchaseService'
import ProductVariantSearch from '@/components/inventory/ProductVariantSearch'

const money = (v) => `৳${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`

export default function PurchaseCreate() {
  const navigate = useNavigate()
  const toast = useToast?.()
  const [suppliers, setSuppliers] = useState([])
  const [supplierId, setSupplierId] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10))
  const [discount, setDiscount] = useState(0)
  const [shippingCost, setShippingCost] = useState(0)
  const [tax, setTax] = useState(0)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([])
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getActiveSuppliers()
      .then((res) => setSuppliers(res.data || []))
      .catch((err) => toast?.error?.(err.message || 'Failed to load suppliers.'))
  }, [])

  const addItem = (product, variant) => {
    if (items.some((it) => it.variant_id === variant.id)) {
      toast?.error?.('This variant is already in the purchase.')
      return
    }
    setItems((list) => [
      ...list,
      {
        key: `${product.id}-${variant.id}`,
        product_id: product.id,
        variant_id: variant.id,
        product_name: product.name,
        sku: variant.sku,
        attributes: [variant.size, variant.color].filter(Boolean).join(' / '),
        quantity: 1,
        unit_cost: Number(variant.purchase_price) || 0,
        discount: 0,
      },
    ])
  }

  const updateItem = (key, patch) => {
    setItems((list) => list.map((it) => (it.key === key ? { ...it, ...patch } : it)))
  }

  const removeItem = (key) => {
    setItems((list) => list.filter((it) => it.key !== key))
  }

  const itemsSubtotal = items.reduce((sum, it) => sum + (Number(it.unit_cost) * Number(it.quantity) - Number(it.discount || 0)), 0)
  const grandTotal = itemsSubtotal - Number(discount || 0) + Number(shippingCost || 0) + Number(tax || 0)

  const save = async (status) => {
    if (!supplierId) {
      toast?.error?.('Please select a supplier.')
      return
    }
    if (items.length === 0) {
      toast?.error?.('Add at least one product to the purchase.')
      return
    }

    setSaving(true)
    setErrors({})
    try {
      const res = await createPurchase({
        supplier_id: supplierId,
        purchase_date: purchaseDate,
        discount,
        shipping_cost: shippingCost,
        tax,
        notes,
        status,
        items: items.map((it) => ({
          product_id: it.product_id,
          variant_id: it.variant_id,
          quantity: it.quantity,
          unit_cost: it.unit_cost,
          discount: it.discount,
        })),
      })
      toast?.success?.('Purchase created successfully')
      navigate(`/admin/purchases/${res.data.id}`)
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
        toast?.error?.(err.message || 'Please correct the highlighted fields.')
      } else {
        toast?.error?.(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-ink">New Purchase</h1>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-sm border border-stone-light bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-base text-ink">Purchase Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">
                Supplier <span className="text-oxblood">*</span>
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
              >
                <option value="">Select a supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.company_name ? ` (${s.company_name})` : ''}</option>
                ))}
              </select>
              {errors.supplier_id && <p className="mt-1 text-xs text-danger">{errors.supplier_id[0]}</p>}
            </div>
            <Input
              label="Purchase Date"
              type="date"
              required
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              error={errors.purchase_date?.[0]}
            />
          </div>
        </div>

        <div className="rounded-sm border border-stone-light bg-white p-5">
          <h2 className="mb-4 font-display text-base text-ink">Totals</h2>
          <div className="space-y-3">
            <Input label="Discount" type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            <Input label="Shipping / Other Cost" type="number" min="0" step="0.01" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} />
            <Input label="Tax" type="number" min="0" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} />
          </div>
          <dl className="mt-4 space-y-1.5 border-t border-stone-light pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd className="text-ink">{money(itemsSubtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-stone">Discount</dt><dd className="text-ink">-{money(discount)}</dd></div>
            <div className="flex justify-between"><dt className="text-stone">Shipping</dt><dd className="text-ink">+{money(shippingCost)}</dd></div>
            <div className="flex justify-between"><dt className="text-stone">Tax</dt><dd className="text-ink">+{money(tax)}</dd></div>
            <div className="flex justify-between border-t border-stone-light pt-1.5 font-medium"><dt className="text-ink">Grand Total</dt><dd className="text-ink">{money(grandTotal)}</dd></div>
          </dl>
        </div>
      </div>

      <div className="mb-6 rounded-sm border border-stone-light bg-white p-5">
        <h2 className="mb-4 font-display text-base text-ink">Products</h2>
        <div className="mb-4 max-w-md">
          <ProductVariantSearch onSelect={addItem} />
        </div>
        {errors.items && <p className="mb-3 text-xs text-danger">{errors.items[0]}</p>}

        {items.length === 0 ? (
          <p className="text-sm text-stone">No products added yet. Search above to add items.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-light text-[11px] uppercase tracking-wider text-stone">
                  <th className="py-2 font-utility">Product</th>
                  <th className="py-2 font-utility">Qty</th>
                  <th className="py-2 font-utility">Unit Cost</th>
                  <th className="py-2 font-utility">Discount</th>
                  <th className="py-2 font-utility text-right">Subtotal</th>
                  <th className="py-2 font-utility"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.key} className="border-b border-stone-light last:border-0">
                    <td className="py-2">
                      <p className="text-ink">{it.product_name}</p>
                      <p className="text-xs text-stone">{it.sku} {it.attributes && `· ${it.attributes}`}</p>
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => updateItem(it.key, { quantity: Number(e.target.value) })}
                        className="w-20 rounded-sm border border-stone-light px-2 py-1 text-sm outline-none focus:border-oxblood"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={it.unit_cost}
                        onChange={(e) => updateItem(it.key, { unit_cost: Number(e.target.value) })}
                        className="w-28 rounded-sm border border-stone-light px-2 py-1 text-sm outline-none focus:border-oxblood"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={it.discount}
                        onChange={(e) => updateItem(it.key, { discount: Number(e.target.value) })}
                        className="w-24 rounded-sm border border-stone-light px-2 py-1 text-sm outline-none focus:border-oxblood"
                      />
                    </td>
                    <td className="py-2 text-right text-ink">
                      {money(it.unit_cost * it.quantity - (it.discount || 0))}
                    </td>
                    <td className="py-2 text-right">
                      <button type="button" onClick={() => removeItem(it.key)} className="text-xs font-medium text-danger hover:underline">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-sm border border-stone-light bg-white p-5">
        <label className="mb-1.5 block text-xs font-utility uppercase tracking-wider text-stone">Notes</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink outline-none focus:border-oxblood"
        />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" loading={saving} onClick={() => save('draft')}>
          Save as Draft
        </Button>
        <Button loading={saving} onClick={() => save('ordered')}>
          Place Order
        </Button>
      </div>
    </div>
  )
}
