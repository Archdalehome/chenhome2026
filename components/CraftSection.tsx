import Image from 'next/image'
import Link from 'next/link'
import { unsplashImage } from '@/lib/catalog'

const POINTS = [
  { icon: '♻️', label: 'Responsibly Sourced' },
  { icon: '🤲', label: 'Artisan Made' },
  { icon: '📦', label: 'Small Batch Production' },
  { icon: '🛡️', label: 'Designed to Last' },
]

export default function CraftSection() {
  return (
    <section className="grid md:grid-cols-2">
      <div className="relative h-[420px]">
        <Image
          src={unsplashImage('photo-1558171813-4c088753af8f', 1200)}
          fill
          alt="Artisan hand weaving textiles"
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
        {/* 叠加遮罩，保证白色文字在任何图片区域都可读 */}
        <div aria-hidden="true" className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 flex flex-col justify-center px-6 text-white md:px-10">
          <h2 className="mb-4 text-3xl">
            Crafted by Hand
            <br />
            for a Kinder Home
          </h2>
          <p className="my-4 max-w-md">
            Our pillows are made in partnership with skilled artisans around the world, honoring traditional techniques
            and natural materials.
          </p>
          <Link href="/about" className="w-fit bg-terracotta px-6 py-2">
            OUR CRAFTSMANSHIP →
          </Link>
        </div>
      </div>

      <div className="flex flex-col justify-center bg-white p-6 md:p-10">
        <div className="space-y-6">
          {POINTS.map((point) => (
            <div key={point.label} className="flex items-center gap-4">
              <span aria-hidden="true">{point.icon}</span>
              <span>{point.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
