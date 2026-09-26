'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/app/context/CartContext'
import { formatPrice } from '@/lib/catalog'

export default function CartPage() {
  const { cart, totalPrice, totalItems, updateQty, removeItem, clearCart } = useCart()

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="mb-8 text-4xl">Shopping Cart</h1>

      {cart.length === 0 ? (
        <div>
          <p className="mb-6">Your cart is empty.</p>
          <Link href="/shop" className="underline">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-4 border bg-white p-4">
                <div className="relative h-24 w-24 shrink-0">
                  <Image src={item.image_url} fill alt={item.name} sizes="96px" className="object-cover" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base">{item.name}</h2>
                  <p>{formatPrice(item.price)}</p>
                  <div className="mt-2 flex items-center gap-3">
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

          <div className="h-fit border bg-white p-6">
            <h2 className="mb-4 text-xl">Order Summary</h2>
            <div className="mb-2 flex justify-between">
              <span>Items: {totalItems}</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="mt-4 flex justify-between border-t pt-4 text-xl">
              <span>Total</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            {/* 结算需要后端订单接口：静态站点可接入 Stripe Payment Links 或 Cloudflare Workers */}
            <Link href="/shop" className="mt-6 block w-full bg-terracotta py-3 text-center text-white">
              Continue Shopping
            </Link>
            <button onClick={clearCart} className="mt-3 w-full border py-2">
              Clear Cart
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
