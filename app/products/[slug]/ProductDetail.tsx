'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/app/context/CartContext'
import { formatPrice, productImageUrl, type Product } from '@/lib/catalog'

type Props = {
  product: Product
  collectionTitle: string
}

/**
 * 商品详情交互部分（加购物车）。
 * 页面本体是 Server Component：负责静态生成与 SEO metadata，
 * 这里只把需要交互的部分拆成客户端组件。
 */
export default function ProductDetail({ product, collectionTitle }: Props) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addToCart({
      id: product.slug,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image_url: productImageUrl(product, 600),
    })
    setAdded(true)
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <nav aria-label="Breadcrumb" className="mb-8 text-xs uppercase tracking-widest text-stone-500">
        <Link href="/shop" className="hover:text-earthText">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="grid gap-12 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden bg-stone-100">
          <Image
            src={productImageUrl(product, 1000)}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        <div>
          {collectionTitle && (
            <Link
              href={`/collections/${product.collectionSlug}`}
              className="mb-2 inline-block text-sm text-stone-500 underline"
            >
              {collectionTitle}
            </Link>
          )}
          <h1 className="mb-4 text-4xl">{product.name}</h1>
          <p className="mb-6 text-2xl text-terracotta">{formatPrice(product.price)}</p>

          <div className="mb-8 space-y-4">
            <p>{product.description}</p>
            <p className="text-sm text-stone-600">{product.detail}</p>
          </div>

          <button onClick={handleAdd} className="bg-terracotta px-8 py-3 text-white hover:opacity-90">
            Add to Cart
          </button>
          <p role="status" aria-live="polite" className="mt-3 h-5 text-sm text-oliveDark">
            {added ? '已加入购物车 ✓' : ''}
          </p>

          <ul className="mt-10 space-y-2 border-t border-stone-200 pt-6 text-sm text-stone-600">
            <li>♻️ Responsibly sourced natural materials</li>
            <li>🤲 Handcrafted by artisans</li>
            <li>📦 Small batch production</li>
            <li>🚚 Free shipping on orders over $150</li>
          </ul>
        </div>
      </div>

      <Link href="/shop" className="mt-12 inline-block text-sm underline">
        ← Back to shop
      </Link>
    </main>
  )
}
