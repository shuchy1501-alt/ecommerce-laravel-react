import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, error, hint, id, className = '', required = false, ...props },
  ref
) {
  const inputId = id || props.name

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-utility uppercase tracking-wider text-stone">
          {label} {required && <span className="text-oxblood">*</span>}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`w-full rounded-sm border bg-white px-3 py-2 text-sm text-ink placeholder:text-stone-light
          transition-colors focus:border-oxblood
          ${error ? 'border-danger' : 'border-stone-light'} ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-stone">{hint}</p>}
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
})

export default Input
