import type { Metadata } from 'next'
import Image from 'next/image'
import { unsplashImage } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Casa Plume was born from a love of travel, craft and the belief that home should feel like a refuge.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-16 text-center">
        <h1 className="mb-4 text-4xl">About Casa Plume</h1>
        <p className="mx-auto max-w-2xl text-stone-600">Textiles for a more beautiful life.</p>
      </div>

      <div className="mb-20 grid items-center gap-10 md:grid-cols-2">
        <div className="relative h-[400px]">
          <Image
            src={unsplashImage('photo-1513519245088-0e12902e5a38', 1200)}
            fill
            alt="Our story — artisan textiles in a warm home"
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div>
          <h2 className="text-3xl mb-4">Our Story</h2>
          <p className="mb-4">Casa Plume was born from a love of travel, craft and the belief that home should feel like a refuge. We partner with artisans worldwide to create pillows that bring beauty, comfort and meaning to everyday living.</p>
          <p className="mb-4">Each piece tells a story — of hands that wove it, traditions passed down through generations, and natural materials gathered from the earth.</p>
          <p>We believe in slow living, in objects that last, and in the quiet power of softness.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 text-center">
        <div className="p-6">
          <div className="text-4xl mb-4">♻️</div>
          <h3 className="text-xl mb-2">Responsibly Sourced</h3>
          <p className="text-sm text-stone-600">Natural materials, carefully chosen.</p>
        </div>
        <div className="p-6">
          <div className="text-4xl mb-4">🤲</div>
          <h3 className="text-xl mb-2">Artisan Made</h3>
          <p className="text-sm text-stone-600">Handcrafted by skilled artisans worldwide.</p>
        </div>
        <div className="p-6">
          <div className="text-4xl mb-4">🛡️</div>
          <h3 className="text-xl mb-2">Designed to Last</h3>
          <p className="text-sm text-stone-600">Built to be loved for years, not seasons.</p>
        </div>
      </div>
    </main>
  )
}
