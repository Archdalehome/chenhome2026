import Image from 'next/image'
import Link from 'next/link'
import { unsplashImage } from '@/lib/catalog'

export default function GiftSection() {
  return (
    <section className="relative">
      <div className="absolute inset-0">
        <Image
          src={unsplashImage('photo-1549465220-1a8b9238cd48', 1200)}
          fill
          alt="Gift wrapped artisan pillow"
          sizes="100vw"
          className="object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 text-white">
        <div className="max-w-md">
          <h2 className="mb-4 text-3xl">A More Meaningful Gift</h2>
          <p className="mb-6">Thoughtful, timeless, and always appreciated.</p>
          <Link href="/shop" className="inline-block bg-terracotta px-6 py-3 text-white">
            SHOP GIFTS →
          </Link>
        </div>
        <p className="absolute right-10 top-20 hidden italic md:block">For the homes and hearts you love.</p>
      </div>
    </section>
  )
}
