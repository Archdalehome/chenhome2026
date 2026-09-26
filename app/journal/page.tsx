import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { unsplashImage } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'The Journal',
  description: 'Stories on craft, home, and a slower way of living — from the Chen Furniture journal.',
  alternates: { canonical: '/journal' },
}

const articles = [
  {
    id: '1',
    title: 'The Art of Layering Textures',
    excerpt: 'How to mix linens, velvets and weaves for an effortlessly layered home.',
    imageId: 'photo-1555041469-a586c61ea9bc',
    date: 'September 12, 2024',
  },
  {
    id: '2',
    title: 'Meet the Artisans of Oaxaca',
    excerpt: 'Inside the workshop where traditional weaving meets modern design.',
    imageId: 'photo-1558171813-4c088753af8f',
    date: 'August 28, 2024',
  },
  {
    id: '3',
    title: 'A Quiet Home: Our Interior Philosophy',
    excerpt: 'Why less is more, and how softness creates spaces that breathe.',
    imageId: 'photo-1505693416388-ac5ce068fe85',
    date: 'August 15, 2024',
  },
]

export default function JournalPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-16 text-center">
        <h1 className="mb-4 text-4xl">The Journal</h1>
        <p className="mx-auto max-w-2xl text-stone-600">Stories on craft, home, and a slower way of living.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {articles.map((article) => (
          <article key={article.id} className="group">
            <div className="relative mb-4 aspect-[4/3] overflow-hidden bg-stone-100">
              <Image
                src={unsplashImage(article.imageId, 800)}
                alt={article.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <p className="mb-2 text-xs text-stone-500">{article.date}</p>
            <h2 className="mb-2 text-xl">{article.title}</h2>
            <p className="text-sm text-stone-600">{article.excerpt}</p>
            {/* 文章详情页尚未实现，这里指向商品与系列页避免死链 */}
            <Link href="/collections" className="mt-3 inline-block text-sm underline">
              Read More →
            </Link>
          </article>
        ))}
      </div>
    </main>
  )
}

