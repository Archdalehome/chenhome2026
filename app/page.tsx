import Image from 'next/image'
import Link from 'next/link'
import CollectionCard from '@/components/CollectionCard'
import FeaturedProducts from '@/components/FeaturedProducts'
import CraftSection from '@/components/CraftSection'
import GiftSection from '@/components/GiftSection'
import StorySection from '@/components/StorySection'
import SubscribeSection from '@/components/SubscribeSection'
import { collectionImageUrl, collections, unsplashImage } from '@/lib/catalog'

export default function Home() {
  const items = [...collections].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-[70vh] md:min-h-[85vh]">
        <div className="absolute inset-0">
          <Image
            src={unsplashImage('photo-1505693416388-ac5ce068fe85', 1600)}
            alt="Living room with linen sofa and artisan pillows"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* 深色渐变保证文字对比度（原版深色文字压在照片上几乎看不清） */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-black/10"
          />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 text-white md:px-16 md:py-40">
          <p className="mb-3 text-sm uppercase tracking-widest">CASA PLUME</p>
          <h1 className="mb-4 text-4xl md:text-6xl">Softness Lives Here</h1>
          <p className="mb-6 max-w-md text-lg">
            Artisan throw pillows for a more beautiful, intentional home.
          </p>
          <Link
            href="/shop"
            className="inline-block bg-terracotta px-6 py-3 text-white transition hover:opacity-90"
          >
            SHOP THE COLLECTIONS →
          </Link>
          <div className="mt-10 flex flex-wrap gap-4 text-sm">
            <span>NATURAL MATERIALS</span>
            <span aria-hidden="true">•</span>
            <span>ARTISAN MADE</span>
            <span aria-hidden="true">•</span>
            <span>A MORE BEAUTIFUL LIFE</span>
          </div>
        </div>
      </section>

      {/* Shop by Collection */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex flex-col items-start justify-between md:flex-row md:items-end">
          <div>
            <h2 className="mb-2 text-3xl">Shop by Collection</h2>
            <p className="max-w-lg">
              Curated pillow collections inspired by places, textures and a slower way of living.
            </p>
          </div>
          <Link href="/collections" className="mt-4 text-sm underline md:mt-0">
            EXPLORE ALL COLLECTIONS →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((collection) => (
            <Link href={`/collections/${collection.slug}`} key={collection.id}>
              <CollectionCard
                title={collection.title}
                sub={collection.sub_title}
                img={collectionImageUrl(collection, 800)}
              />
            </Link>
          ))}
        </div>
      </section>

      <CraftSection />

      {/* Mix Match Section */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-3xl">Mix, Match, Make It Yours</h2>
            <p className="mb-6">Layer textures, play with patterns, and create spaces that feel like you.</p>
            <Link href="/journal" className="text-sm underline">
              GET STYLING IDEAS →
            </Link>
          </div>
          <div className="relative h-[320px]">
            <Image
              src={unsplashImage('photo-1549465220-1a8b9238cd48', 800)}
              fill
              alt="Layered pillows in warm neutral tones"
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <FeaturedProducts />
      <GiftSection />
      <StorySection />
      <SubscribeSection />
    </main>
  )
}
