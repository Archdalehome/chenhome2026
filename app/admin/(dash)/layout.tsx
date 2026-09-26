'use client'

/**
 * 管理后台登录守卫 + 顶部导航。
 *
 * 原实现没有任何鉴权：任何人打开 /admin/dashboard 就能看到后台界面。
 * 鉴权由 Pages Functions 提供：HMAC 签名的 HttpOnly 会话 Cookie，
 * 未登录 / 会话过期则跳转到 /admin/login。
 */
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { hasActiveSession, signOut } from '@/lib/data'

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
