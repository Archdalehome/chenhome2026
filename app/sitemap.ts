import type { MetadataRoute } from 'next'
import { collections, products, siteConfig } from '@/lib/catalog'

/** 构建期生成 sitemap.xml（静态导出同样支持） */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const pages: MetadataRoute.Sitemap = [
    { url: `${siteConfig.url}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteConfig.url}/shop`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteConfig.url}/collections`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteConfig.url}/about`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteConfig.url}/journal`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
  ]

  const collectionPages: MetadataRoute.Sitemap = collections.map((collection) => ({
    url: `${siteConfig.url}/collections/${collection.slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteConfig.url}/products/${product.slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...pages, ...collectionPages, ...productPages]
}
