'use client'

import { useState } from 'react'
import { subscribeEmail } from '@/lib/data'

type Status = 'idle' | 'sending' | 'done' | 'error'

export default function SubscribeSection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  async function handleSubscribe(event: React.FormEvent) {
    event.preventDefault()
    if (!email || status === 'sending') return

    setStatus('sending')
    setMessage('')

    try {
      const { alreadySubscribed } = await subscribeEmail(email.trim().toLowerCase())
      setStatus('done')
      setMessage(alreadySubscribed ? "You're already on the list — thank you!" : 'Thank you for subscribing!')
      setEmail('')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Subscription failed, please try again.')
    }
  }

  return (
    <section className="bg-stone-100 py-16">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="mb-4 text-3xl">Join Our Journal</h2>
        <p className="mb-6">Be the first to know about new collections, artisan stories and special offers.</p>

        {status === 'done' ? (
          <p role="status" className="text-terracotta">
            {message}
          </p>
        ) : (
          <form onSubmit={handleSubscribe} className="flex flex-col justify-center gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="subscribe-email">
              Email address
            </label>
            <input
              id="subscribe-email"
              type="email"
              required
              placeholder="Your email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="max-w-sm flex-1 border border-stone-300 px-4 py-3"
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="bg-terracotta px-6 py-3 text-white disabled:opacity-60"
            >
              {status === 'sending' ? 'SUBSCRIBING…' : 'SUBSCRIBE'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {message}
          </p>
        )}
      </div>
    </section>
  )
}
