import { useState } from 'react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null) // null | 'error' | 'success'

  const handleSubmit = (e) => {
    e.preventDefault()
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!valid) {
      setStatus('error')
      return
    }
    setStatus('success')
    setEmail('')
  }

  return (
    <section className="bg-brand-dark py-14 text-white">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <h2 className="font-brand-display text-3xl font-semibold sm:text-4xl">Stay in Style</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/70">
          Subscribe to get updates on new arrivals, exclusive offers and fashion inspiration.
        </p>
        <form onSubmit={handleSubmit} className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row" noValidate>
          <label htmlFor="newsletter-email" className="sr-only">Email address</label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus(null) }}
            placeholder="Email address"
            className="w-full flex-1 rounded-md border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-brand-primary focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-brand-primary px-6 py-3 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-brand-primary-dark"
          >
            SUBSCRIBE
          </button>
        </form>
        {status === 'error' && <p className="mt-3 text-xs text-red-300">Please enter a valid email address.</p>}
        {status === 'success' && <p className="mt-3 text-xs text-green-300">You're subscribed. Welcome to FashionMart.</p>}
      </div>
    </section>
  )
}
