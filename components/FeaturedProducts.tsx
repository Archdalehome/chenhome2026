import Link from 'next/link'
import ProductCard from './ProductCard'
import { featuredProducts, formatPrice, productImageUrl } from '@/lib/catalog'

export default function FeaturedProducts() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="mb-2 text-3xl">Featured Pillows</h2>
          <p>Customer favorites, for every corner of your home.</p>
        </div>
        <Link href="/shop" className="shrink-0 text-sm underline">
          SHOP ALL →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
        {featuredProducts.map((product) => (
          <ProductCard
            key={product.id}
            name={product.name}
            price={formatPrice(product.price)}
            img={productImageUrl(product, 600)}
            href={`/products/${product.slug}`}
          />
        ))}
      </div>
    </section>
  )
}
