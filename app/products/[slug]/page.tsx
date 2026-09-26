import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCollectionTitle, getProductBySlug, productImageUrl, products } from '@/lib/catalog'
import ProductDetail from './ProductDetail'

type Props = {
  params: { slug: string }
}

/** 构建期生成所有商品静态页（静态导出必需） */
export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }))
}

/** 静态站点没有按需渲染，未知 slug 直接 404 */
export const dynamicParams = false

export function generateMetadata({ params }: Props): Metadata {
  const product = getProductBySlug(params.slug)
  if (!product) return {}
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: productImageUrl(product, 1200) }],
    },
  }
}

export default function ProductDetailPage({ params }: Props) {
  const product = getProductBySlug(params.slug)
  if (!product) notFound()

  return <ProductDetail product={product} collectionTitle={getCollectionTitle(product.collectionSlug)} />
}
