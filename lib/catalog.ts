/**
 * 前台静态内容单一数据源（single source of truth）
 *
 * 首页 / 商品列表 / 商品详情 / 系列详情 全部从这里取数据，
 * 并由 `generateStaticParams` 在构建期生成静态页面。
 *
 * 如果希望前台展示 Supabase 中的实时数据，可把 `lib/data.ts` 的
 * 查询结果接入这些页面（或在后台保存后触发 Cloudflare Pages 重新构建）。
 */

export type Collection = {
  id: string
  slug: string
  title: string
  sub_title: string
  imageId: string
  sortOrder: number
}

export type Product = {
  id: string
  slug: string
  name: string
  price: number
  imageId: string
  description: string
  detail: string
  collectionSlug: string
  isFeatured: boolean
  sortOrder: number
}

/**
 * 生成 Unsplash 图片地址。
 * `auto=format` 让 Unsplash 按浏览器能力返回 webp/avif，比原始固定 URL 更省流量。
 */
export function unsplashImage(imageId: string, width: number, quality = 70) {
  return `https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=${width}&q=${quality}`
}

export const collections: Collection[] = [
  {
    id: '1',
    slug: 'neutral-linen',
    title: 'Neutral Linen',
    sub_title: 'SOFT NATURAL LINEN TONES',
    imageId: 'photo-1584100936595-c0654b55a2e2',
    sortOrder: 1,
  },
  {
    id: '2',
    slug: 'textured-weaves',
    title: 'Textured Weaves',
    sub_title: 'RICH WOVEN TEXTURES',
    imageId: 'photo-1555041469-a586c61ea9bc',
    sortOrder: 2,
  },
  {
    id: '3',
    slug: 'vintage-hues',
    title: 'Vintage Hues',
    sub_title: 'MUTED VINTAGE COLOR PALETTE',
    imageId: 'photo-1505693319-338cfb69814b',
    sortOrder: 3,
  },
]

export const products: Product[] = [
  {
    id: '1',
    slug: 'olivier-linen-pillow',
    name: 'Olivier Linen Pillow',
    price: 98,
    imageId: 'photo-1584100936595-c0654b55a2e2',
    description: 'Soft washed linen pillow in warm oat tone.',
    detail: '18"x18", linen cover, down alternative insert included.',
    collectionSlug: 'neutral-linen',
    isFeatured: true,
    sortOrder: 1,
  },
  {
    id: '2',
    slug: 'riviera-stripe-pillow',
    name: 'Riviera Stripe Pillow',
    price: 98,
    imageId: 'photo-1555041469-a586c61ea9bc',
    description: 'Subtle thin stripe woven textile.',
    detail: '20"x20", cotton blend, hidden zipper.',
    collectionSlug: 'textured-weaves',
    isFeatured: true,
    sortOrder: 2,
  },
  {
    id: '3',
    slug: 'sienne-embroidered-pillow',
    name: 'Sienne Embroidered Pillow',
    price: 118,
    imageId: 'photo-1505693416388-ac5ce068fe85',
    description: 'Hand embroidered floral motif.',
    detail: '18"x22", linen base, dry clean recommended.',
    collectionSlug: 'vintage-hues',
    isFeatured: true,
    sortOrder: 3,
  },
  {
    id: '4',
    slug: 'paloma-pillow',
    name: 'Paloma Pillow',
    price: 98,
    imageId: 'photo-1505693319-338cfb69814b',
    description: 'Solid warm clay textured pillow.',
    detail: '20"x20", heavy woven cotton.',
    collectionSlug: 'neutral-linen',
    isFeatured: true,
    sortOrder: 4,
  },
  {
    id: '5',
    slug: 'terra-velvet-pillow',
    name: 'Terra Velvet Pillow',
    price: 98,
    imageId: 'photo-1549465220-1a8b9238cd48',
    description: 'Plush muted terracotta velvet.',
    detail: '18"x18", polyester velvet, removable cover.',
    collectionSlug: 'vintage-hues',
    isFeatured: true,
    sortOrder: 5,
  },
  {
    id: '6',
    slug: 'esme-lumbar-pillow',
    name: 'Esme Lumbar Pillow',
    price: 96,
    imageId: 'photo-1558171813-4c088753af8f',
    description: 'Long lumbar woven accent pillow.',
    detail: '12"x24", mixed fiber weave.',
    collectionSlug: 'textured-weaves',
    isFeatured: true,
    sortOrder: 6,
  },
]

export const featuredProducts = [...products]
  .filter((product) => product.isFeatured)
  .sort((a, b) => a.sortOrder - b.sortOrder)

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug)
}

export function getCollectionBySlug(slug: string): Collection | undefined {
  return collections.find((collection) => collection.slug === slug)
}

export function getProductsByCollection(slug: string): Product[] {
  return products
    .filter((product) => product.collectionSlug === slug)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function getCollectionTitle(slug: string): string {
  return getCollectionBySlug(slug)?.title ?? ''
}

export function productImageUrl(product: Product, width = 800): string {
  return unsplashImage(product.imageId, width)
}

export function collectionImageUrl(collection: Collection, width = 800): string {
  return unsplashImage(collection.imageId, width)
}

/** $98 / $96.5 —— 整数不显示小数，与设计稿一致 */
export function formatPrice(price: number): string {
  return `$${Number.isInteger(price) ? price : price.toFixed(2)}`
}

/** 站点级静态文案（品牌名、描述、站点 URL；前台构建期使用） */
export const siteConfig = {
  name: 'Chen Furniture',
  tagline: 'Textiles for a more beautiful life',
  description: 'Artisan throw pillows for a more beautiful, intentional home.',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://chenhome2026.pages.dev').replace(/\/$/, ''),
}
