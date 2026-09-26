'use client'

/**
 * 管理后台登录守卫 + 顶部导航。
 *
 * 原实现没有任何鉴权：任何人打开 /admin/dashboard 就能看到后台界面。
 * 现在统一用 Supabase Auth 会话校验，未登录则跳转到 /admin/login。
 */
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { hasActiveSession, signOut } from '@/lib/data'
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from '@/lib/supabase'

const NAV = [
  { href: '/admin/dashboard', label: '概览' },
  { href: '/admin/products', label: '商品' },
  { href: '/admin/collections', label: '系列' },
  { href: '/admin/home-editor', label: '首页内容' },
  { href: '/admin/subscribers', label: '订阅者' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [status, setStatus] = useState<'checking' | 'ready'>('checking')

  useEffect(() => {
    let alive = true

    if (!isSupabaseConfigured) {
      setStatus('ready')
      return () => {
        alive = false
      }
    }

    hasActiveSession()
      .then((ok) => {
        if (!alive) return
        if (ok) {
          setStatus('ready')
        } else {
          router.replace('/admin/login')
        }
      })
      .catch(() => {
        if (alive) router.replace('/admin/login')
      })

    return () => {
      alive = false
    }
  }, [router])

  const handleSignOut = useCallback(async () => {
    await signOut()
    router.replace('/admin/login')
  }, [router])

  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24">
        <h1 className="mb-4 text-2xl">后台暂不可用</h1>
        <p className="text-sm leading-6 text-stone-600">{SUPABASE_NOT_CONFIGURED_MESSAGE}</p>
      </main>
    )
  }

  if (status === 'checking') {
    return <main className="mx-auto max-w-7xl px-6 py-24 text-stone-500">正在校验登录状态…</main>
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <nav className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-stone-200 pb-4 text-sm">
        {NAV.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={active ? 'font-medium text-terracotta underline' : 'text-stone-600 hover:text-earthText'}
            >
              {item.label}
            </Link>
          )
        })}
        <button onClick={handleSignOut} className="ml-auto text-stone-600 hover:text-red-600">
          退出登录
        </button>
      </nav>
      {children}
    </main>
  )
}
