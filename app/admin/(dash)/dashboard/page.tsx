'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { listCollections, listProducts, listSubscribers } from '@/lib/data'

type Stats = { products: number; collections: number; subscribers: number }

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ products: 0, collections: 0, subscribers: 0 })
  const [warning, setWarning] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const [productList, collectionList, subscriberList] = await Promise.all([
          listProducts(),
          listCollections(),
          // 订阅者表只对管理员开放读取；失败时不影响其它统计
          listSubscribers().catch(() => []),
        ])
        if (!alive) return
        setStats({
          products: productList.length,
          collections: collectionList.length,
          subscribers: subscriberList.length,
        })
      } catch (error) {
        if (alive) setWarning(error instanceof Error ? error.message : '数据加载失败')
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [])

  return (
    <section>
      <h1 className="mb-8 text-3xl">Admin Dashboard</h1>

      {warning && (
        <p className="mb-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{warning}</p>
      )}

      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { label: 'Total Products', value: stats.products },
          { label: 'Collections', value: stats.collections },
          { label: 'Email Subscribers', value: stats.subscribers },
        ].map((card) => (
          <div key={card.label} className="rounded border bg-white p-6 shadow-sm">
            <h2 className="text-xl">{card.label}</h2>
            <p className="mt-2 text-4xl text-terracotta">{loading ? '—' : card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Link href="/admin/products" className="rounded bg-terracotta p-4 text-center text-white">
          Manage Products
        </Link>
        <Link href="/admin/collections" className="rounded bg-terracotta p-4 text-center text-white">
          Manage Collections
        </Link>
        <Link href="/admin/home-editor" className="rounded bg-terracotta p-4 text-center text-white">
          Edit Homepage Content
        </Link>
        <Link href="/admin/subscribers" className="rounded bg-terracotta p-4 text-center text-white">
          View Subscribers
        </Link>
      </div>

      <p className="mt-10 rounded border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-600">
        提示：后台数据保存在 Cloudflare D1，上传的图片存在 R2。前台页面为静态导出（构建期生成），
        修改商品/系列后如需立即反映到前台，可在 Cloudflare Pages 中触发一次重新部署
        （Deploy hook 或 Push 一次提交）。
      </p>
    </section>
  )
}
