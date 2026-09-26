'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signInWithEmail } from '@/lib/data'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      await signInWithEmail(email.trim(), pwd)
      router.replace('/admin/dashboard')
    } catch (error) {
      setErr(error instanceof Error ? error.message : '登录失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="mb-8 text-3xl">Admin Login</h1>

      <form onSubmit={login} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm text-stone-600">Email</span>
          <input
            type="email"
            required
            autoComplete="username"
            className="w-full border p-3"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-stone-600">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            className="w-full border p-3"
            placeholder="••••••••"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-terracotta px-6 py-3 text-white disabled:opacity-60"
        >
          {loading ? '登录中…' : 'Sign In'}
        </button>
      </form>
    </main>
  )
}

