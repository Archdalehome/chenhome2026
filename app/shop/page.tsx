import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice, productImageUrl, products } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Shop All Pillows',
  description: 'Browse every Casa Plume artisan pillow — washed linen, woven textures and muted vintage hues.',
  alternates: { canonical: '/shop' },
}

export default function ShopPage() {
  const items = [...products].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="mb-3 text-4xl">Shop All Pillows</h1>
      <p className="mb-10 text-stone-600">{items.length} artisan pieces, made in small batches.</p>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
        {items.map((product) => (
          <Link href={`/products/${product.slug}`} key={product.id} className="group">
            <div className="relative mb-3 aspect-square overflow-hidden bg-stone-100">
              <Image
                src={productImageUrl(product, 600)}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <h2 className="text-base">{product.name}</h2>
            <p className="text-sm text-stone-600">{formatPrice(product.price)}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}

