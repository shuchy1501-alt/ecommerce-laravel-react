const tones = {
  neutral: 'text-stone bg-bone-dim',
  success: 'text-success bg-success/10',
  danger: 'text-danger bg-danger/10',
  warning: 'text-gold bg-gold/10',
  accent: 'text-oxblood bg-oxblood/10',
}

/** Small status pill styled like a garment swing-tag — FashionMart's signature UI mark. */
export default function Badge({ children, tone = 'neutral', className = '' }) {
  return (
    <span
      className={`tag-notch inline-flex items-center gap-1 rounded-sm py-1 pl-4 pr-2.5 text-[11px] font-utility uppercase tracking-wider ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
