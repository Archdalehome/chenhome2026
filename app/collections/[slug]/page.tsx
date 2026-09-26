import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  collectionImageUrl,
  collections,
  formatPrice,
  getCollectionBySlug,
  getProductsByCollection,
  productImageUrl,
} from '@/lib/catalog'

type Props = {
  params: { slug: string }
}

/** 构建期生成所有系列静态页（静态导出必需） */
export function generateStaticParams() {
  return collections.map((collection) => ({ slug: collection.slug }))
}

/** 静态站点没有按需渲染，未知 slug 直接 404 */
export const dynamicParams = false

export function generateMetadata({ params }: Props): Metadata {
  const collection = getCollectionBySlug(params.slug)
  if (!collection) return {}
  return {
    title: collection.title,
    description: collection.sub_title,
    alternates: { canonical: `/collections/${collection.slug}` },
    openGraph: {
      title: collection.title,
      description: collection.sub_title,
      images: [{ url: collectionImageUrl(collection, 1200) }],
    },
  }
}

export default function SingleCollectionPage({ params }: Props) {
  const collection = getCollectionBySlug(params.slug)
  if (!collection) notFound()

  const items = getProductsByCollection(collection.slug)

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs uppercase tracking-widest text-stone-500">
        <Link href="/collections" className="hover:text-earthText">
          Collections
        </Link>
        <span className="mx-2">/</span>
        <span>{collection.title}</span>
      </nav>

      <div className="relative mb-12 h-56 overflow-hidden bg-stone-100 md:h-72">
        <Image
          src={collectionImageUrl(collection, 1600)}
          alt={collection.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-black/25 p-6 text-white md:p-10">
          <h1 className="text-4xl">{collection.title}</h1>
          <p className="mt-2 text-sm uppercase tracking-widest">{collection.sub_title}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-stone-500">这个系列暂时还没有商品。</p>
      ) : (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => (
            <Link href={`/products/${product.slug}`} key={product.id} className="group">
              <div className="relative mb-3 aspect-square overflow-hidden bg-stone-100">
                <Image
                  src={productImageUrl(product, 600)}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <h2 className="text-base">{product.name}</h2>
              <p className="text-sm text-stone-600">{formatPrice(product.price)}</p>
            </Link>
          ))}
        </div>
      )}

      <Link href="/shop" className="mt-12 inline-block text-sm underline">
        ← Shop all pillows
      </Link>
    </main>
  )
}

