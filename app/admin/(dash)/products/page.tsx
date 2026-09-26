'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createProduct,
  deleteProduct,
  listCollections,
  listProducts,
  updateProduct,
  uploadProductImage,
  type CollectionRow,
  type ProductInput,
  type ProductRow,
} from '@/lib/data'
import { formatPrice } from '@/lib/catalog'

type FormState = {
  name: string
  slug: string
  price: number
  image_url: string
  description: string
  detail: string
  collection_id: string
  is_featured: boolean
  sort_order: number
}

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  price: 0,
  image_url: '',
  description: '',
  detail: '',
  collection_id: '',
  is_featured: false,
  sort_order: 0,
}

export default function AdminProducts() {
  const [list, setList] = useState<ProductRow[]>([])
  const [collections, setCollections] = useState<CollectionRow[]>([])
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const collectionName = useMemo(() => {
    const map = new Map(collections.map((item) => [item.id, item.title]))
    return (id: string | null) => (id ? map.get(id) ?? '—' : '—')
  }, [collections])

  const load = useCallback(async () => {
    try {
      const [productList, collectionList] = await Promise.all([listProducts(), listCollections()])
      setList(productList)
      setCollections(collectionList)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function resetForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const url = await uploadProductImage(file)
      setForm((prev) => ({ ...prev, image_url: url }))
      setMessage('图片上传成功')
    } catch (err) {
      setError(err instanceof Error ? err.message : '图片上传失败')
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    setError('')
    setMessage('')

    if (!form.name.trim()) return setError('请填写商品名称')
    if (!form.image_url) return setError('请先上传商品图片')
    if (!form.slug.trim()) return setError('请填写 slug（用于商品详情页地址）')

    const payload: ProductInput = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      price: Number(form.price) || 0,
      image_url: form.image_url,
      description: form.description,
      detail: form.detail,
      collection_id: form.collection_id || null,
      is_featured: form.is_featured,
      sort_order: Number(form.sort_order) || 0,
    }

    setBusy(true)
    try {
      if (editingId) {
        await updateProduct(editingId, payload)
        setMessage('商品已更新')
      } else {
        await createProduct(payload)
        setMessage('商品已新增')
      }
      resetForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`确定删除「${name}」？该操作不可撤销。`)) return
    setBusy(true)
    try {
      await deleteProduct(id)
      if (editingId === id) resetForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    } finally {
      setBusy(false)
    }
  }

  function edit(item: ProductRow) {
    setEditingId(item.id)
    setForm({
      name: item.name ?? '',
      slug: item.slug ?? '',
      price: Number(item.price) || 0,
      image_url: item.image_url ?? '',
      description: item.description ?? '',
      detail: item.detail ?? '',
      collection_id: item.collection_id ?? '',
      is_featured: Boolean(item.is_featured),
      sort_order: Number(item.sort_order) || 0,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const inputClass = 'w-full border p-2'

  return (
    <section>
      <h1 className="mb-8 text-3xl">Product Manager</h1>

      {message && <p className="mb-4 text-sm text-oliveDark">{message}</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-10 rounded border bg-white p-6">
        <h2 className="mb-4 text-xl">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            商品名称
            <input
              className={`${inputClass} mt-1`}
              value={form.name}
              onChange={(e) => {
                const name = e.target.value
                setForm((prev) => ({
                  ...prev,
                  name,
                  // 新增时自动生成 slug，省去手填
                  slug: editingId
                    ? prev.slug
                    : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                }))
              }}
            />
          </label>
          <label className="text-sm">
            Slug（详情页地址 /products/slug）
            <input
              className={`${inputClass} mt-1`}
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            价格
            <input
              className={`${inputClass} mt-1`}
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
            />
          </label>
          <label className="text-sm">
            所属系列
            <select
              className={`${inputClass} mt-1`}
              value={form.collection_id}
              onChange={(e) => setForm((p) => ({ ...p, collection_id: e.target.value }))}
            >
              <option value="">未指定</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            简介
            <input
              className={`${inputClass} mt-1`}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </label>
          <label className="text-sm md:col-span-2">
            详情（尺寸 / 材质等）
            <input
              className={`${inputClass} mt-1`}
              value={form.detail}
              onChange={(e) => setForm((p) => ({ ...p, detail: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            排序（数字小的靠前）
            <input
              className={`${inputClass} mt-1`}
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm md:pt-6">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))}
            />
            首页 Featured 展示
          </label>
          <div className="text-sm">
            商品图片
            <input className="mt-1 block" type="file" accept="image/*" onChange={handleUpload} disabled={busy} />
            {form.image_url && (
              // 后台预览用原生 img：图片域名不固定（Supabase Storage），无需 next/image
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image_url} alt="图片预览" className="mt-2 h-32 w-32 object-cover" />
            )}
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={save} disabled={busy} className="bg-terracotta px-4 py-2 text-white disabled:opacity-60">
            {busy ? '处理中…' : 'Save'}
          </button>
          {editingId && (
            <button onClick={resetForm} className="border px-4 py-2">
              取消编辑
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {list.map((item) => (
          <div key={item.id} className="border bg-white p-4">
            <div className="relative mb-3 h-40 w-full">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-stone-100 text-xs text-stone-400">无图片</div>
              )}
            </div>
            <h3>{item.name}</h3>
            <p className="text-sm">{formatPrice(Number(item.price) || 0)}</p>
            <p className="text-xs text-stone-500">{collectionName(item.collection_id)}</p>
            <div className="mt-3 flex gap-3 text-sm">
              <button onClick={() => edit(item)}>Edit</button>
              <button onClick={() => remove(item.id, item.name)} className="text-red-500">
                Delete
              </button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-stone-500">暂无商品，先在上方新增一个吧。</p>}
      </div>
    </section>
  )
}
