'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCart } from '@/app/context/CartContext'

const NAV_LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/collections', label: 'Collections' },
  { href: '/about', label: 'About' },
  { href: '/journal', label: 'Journal' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { totalItems, setCartOpen } = useCart()
  const pathname = usePathname()

  // 路由变化后自动收起移动端菜单，避免菜单遮挡新页面
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-warmBg/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-2xl">
          Casa Plume
        </Link>

        <nav aria-label="Main" className="hidden gap-8 text-sm md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
              className={pathname === link.href ? 'underline' : 'hover:opacity-70'}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 购物车入口在移动端同样保留（原版移动端无法打开购物车） */}
        <div className="flex items-center gap-4">
          <button type="button" aria-label={`购物车，${totalItems} 件商品`} onClick={() => setCartOpen(true)} className="relative text-lg">
            <span aria-hidden="true">🛒</span>
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta text-xs text-white">
                {totalItems}
              </span>
            )}
          </button>
          <button
            type="button"
            className="md:hidden"
            aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span aria-hidden="true">{mobileOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav aria-label="Mobile" className="flex flex-col gap-4 px-6 pb-6 text-sm md:hidden">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
