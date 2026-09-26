'use client'

import { useState } from 'react'

type Status = 'idle' | 'sending' | 'done' | 'error'

// 直接读取 NEXT_PUBLIC_*，构建时会被内联，避免把 supabase-js 打进首页首屏包
const isConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)

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
      // 动态 import：supabase-js 只在真正提交时按需加载（独立 chunk）
      const { subscribeEmail } = await import('@/lib/data')
      await subscribeEmail(email.trim().toLowerCase())
      setStatus('done')
      setMessage('Thank you for subscribing!')
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
        <p className="mb-6">
          Be the first to know about new collections, artisan stories and special offers.
        </p>

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
              disabled={status === 'sending' || !isConfigured}
              className="bg-terracotta px-6 py-3 text-white disabled:opacity-60"
            >
              {status === 'sending' ? 'SUBSCRIBING…' : 'SUBSCRIBE'}
            </button>
            <p role="alert" aria-live="polite" className="text-sm text-red-600 sm:hidden">
              {status === 'error' ? message : ''}
            </p>
          </form>
        )}

        {status === 'error' && <p className="mt-3 hidden text-sm text-red-600 sm:block">{message}</p>}
        {!isConfigured && (
          <p className="mt-4 text-xs text-stone-500">
            订阅功能需要在 Cloudflare 环境变量中配置 Supabase（见 README）。
          </p>
        )}
      </div>
    </section>
  )
}
