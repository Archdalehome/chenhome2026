'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'
import { useCart } from '@/app/context/CartContext'
import { formatPrice } from '@/lib/catalog'

export default function CartSidebar() {
  const { cart, totalPrice, totalItems, cartOpen, setCartOpen, updateQty, removeItem, clearCart } = useCart()

  // Esc 关闭 + 打开时锁定背景滚动
  useEffect(() => {
    if (!cartOpen) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setCartOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [cartOpen, setCartOpen])

  if (!cartOpen) return null

  return (
    <>
      <button
        type="button"
        aria-label="关闭购物车"
        onClick={() => setCartOpen(false)}
        className="fixed inset-0 z-50 cursor-default bg-black/40"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="购物车"
        className="fixed right-0 top-0 z-50 h-full w-full overflow-auto bg-white md:w-[420px]"
      >
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl">Your Cart ({totalItems})</h2>
            <button type="button" onClick={() => setCartOpen(false)} aria-label="关闭购物车">
              ✕
            </button>
          </div>

          {cart.length === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            <>
              <div className="space-y-6 border-b pb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-20 w-20 shrink-0">
                      <Image src={item.image_url} fill alt={item.name} sizes="80px" className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3>{item.name}</h3>
                      <p>{formatPrice(item.price)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          aria-label={`减少 ${item.name} 数量`}
                          className="h-8 w-8 border"
                        >
                          −
                        </button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          aria-label={`增加 ${item.name} 数量`}
                          className="h-8 w-8 border"
                        >
                          +
                        </button>
                        <button onClick={() => removeItem(item.id)} className="ml-4 text-sm text-red-500">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="py-6">
                <div className="mb-6 flex justify-between text-xl">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <Link
                  href="/cart"
                  onClick={() => setCartOpen(false)}
                  className="mb-3 block w-full bg-terracotta py-3 text-center text-white"
                >
                  View Cart & Checkout
                </Link>
                <button onClick={clearCart} className="w-full border py-2">
                  Clear Cart
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
