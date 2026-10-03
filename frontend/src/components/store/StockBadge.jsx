import { stockLabel } from '@/data/mockProducts'

const TONE_CLASSES = {
  success: 'text-brand-success bg-green-50',
  warning: 'text-brand-warning bg-amber-50',
  danger: 'text-brand-danger bg-red-50',
}

export default function StockBadge({ stock, minStock }) {
  const { label, tone } = stockLabel(stock, minStock)
  return (
    <span className={`inline-flex w-fit items-center rounded px-2 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {label}
    </span>
  )
}
