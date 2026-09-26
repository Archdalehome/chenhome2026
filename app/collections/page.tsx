import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { collectionImageUrl, collections, getProductsByCollection } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Our Collections',
  description: 'Explore Casa Plume textile collections — each inspired by travel and natural textures.',
  alternates: { canonical: '/collections' },
}

export default function CollectionsPage() {
  const items = [...collections].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="mb-4 text-4xl">Our Collections</h1>
      <p className="mb-12 max-w-2xl text-stone-600">
        Explore our handcrafted textile collections, each inspired by travel and natural textures.
      </p>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((collection) => (
          <Link href={`/collections/${collection.slug}`} key={collection.id} className="group">
            <div className="relative mb-4 aspect-[4/3] overflow-hidden bg-stone-100">
              <Image
                src={collectionImageUrl(collection, 800)}
                alt={collection.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <h2 className="text-xl">{collection.title}</h2>
            <p className="text-sm text-stone-500">{collection.sub_title}</p>
            <p className="mt-1 text-xs text-stone-400">
              {getProductsByCollection(collection.slug).length} pieces
            </p>
          </Link>
        ))}
      </div>
    </main>
  )
}

