import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/ui/Modal'
import SizeSelector from './SizeSelector'
import ColorSelector from './ColorSelector'
import QuantitySelector from './QuantitySelector'
import StockBadge from './StockBadge'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'

export default function QuickAddModal({ product, open, onClose }) {
  const { addItem } = useCart()
  const toast = useToast()
  const [size, setSize] = useState(null)
  const [color, setColor] = useState(null)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (open && product) {
      setSize(null)
      setColor(null)
      setQuantity(1)
    }
  }, [open, product])

  const variant = useMemo(() => {
    if (!product || !size || !color) return null
    return product.variants.find((v) => v.size === size && v.color === color) || null
  }, [product, size, color])

  const [adding, setAdding] = useState(false)

  if (!product) return null

  const sizeAvailable = (s) => product.variants.some((v) => v.size === s && v.stock > 0)
  const colorAvailable = (c) => product.variants.some((v) => v.color === c && v.stock > 0)

  const canAdd = variant && variant.stock > 0

  const handleAdd = async () => {
    if (!canAdd) return
    setAdding(true)
    try {
      await addItem(product.id, variant.id, quantity)
      toast.success('Product added to cart.')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Could not add this product to your cart.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={product.name} size="md">
      <div className="flex gap-4">
        <img src={product.images?.[0] || 'https://placehold.co/300x400?text=No+Image'} alt={product.name} className="h-28 w-24 flex-shrink-0 rounded-md object-cover" />
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase text-gray-500">{product.brand}</span>
          <div className="flex items-baseline gap-2">
            <span className="font-brand-display text-xl font-semibold text-brand-dark">৳{product.price.toLocaleString()}</span>
            {product.oldPrice && <span className="text-sm text-gray-400 line-through">৳{product.oldPrice.toLocaleString()}</span>}
          </div>
          {variant && <StockBadge stock={variant.stock} minStock={product.minStock} />}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-brand-dark">Size</p>
          <SizeSelector sizes={product.sizes} selected={size} onSelect={setSize} isAvailable={sizeAvailable} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-brand-dark">Color</p>
          <ColorSelector colors={product.colors} selected={color} onSelect={setColor} isAvailable={colorAvailable} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-brand-dark">Quantity</p>
          <QuantitySelector value={quantity} onChange={setQuantity} max={variant ? variant.stock : 10} />
        </div>
      </div>

      {!size || !color ? (
        <p className="mt-4 text-xs text-gray-500">Select a size and color to continue.</p>
      ) : !canAdd ? (
        <p className="mt-4 text-xs text-brand-danger">This combination is out of stock.</p>
      ) : null}

      <button
        type="button"
        onClick={handleAdd}
        disabled={!canAdd || adding}
        className="mt-5 w-full rounded-md bg-brand-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {adding ? 'ADDING…' : 'ADD TO CART'}
      </button>
    </Modal>
  )
}
