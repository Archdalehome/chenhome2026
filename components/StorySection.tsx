import Image from 'next/image'
import Link from 'next/link'
import { unsplashImage } from '@/lib/catalog'

export default function StorySection() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2">
      <div className="relative h-[350px]">
        <Image
          src={unsplashImage('photo-1513519245088-0e12902e5a38', 1200)}
          fill
          alt="Mediterranean landscape inspiring our collections"
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      <div>
        <h2 className="mb-4 text-3xl">Our Story</h2>
        <p className="mb-6">
          Casa Plume was born from a love of travel, craft and the belief that home should feel like a refuge. We
          partner with artisans worldwide to create pillows that bring beauty, comfort and meaning to everyday living.
        </p>
        <Link href="/about" className="text-sm underline">
          OUR STORY →
        </Link>
        <figure className="mt-8 border-l-2 border-stone-300 pl-4">
          <blockquote className="italic">
            &ldquo;The most beautiful pillows I&apos;ve ever owned. The quality, the textures, the story behind them — it
            all feels so special.&rdquo;
          </blockquote>
          <figcaption className="mt-2 text-sm">— EMILY R., VERIFIED CUSTOMER</figcaption>
        </figure>
      </div>
    </section>
  )
}
