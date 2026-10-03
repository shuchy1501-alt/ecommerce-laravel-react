const variants = {
  primary: 'bg-ink text-bone hover:bg-ink-soft',
  accent: 'bg-oxblood text-bone hover:bg-oxblood-light',
  outline: 'border border-ink text-ink hover:bg-ink hover:text-bone',
  ghost: 'text-ink hover:bg-bone-dim',
  danger: 'bg-danger text-bone hover:opacity-90',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  return (
    <Component
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-sm font-medium tracking-wide
        transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </Component>
  )
}
