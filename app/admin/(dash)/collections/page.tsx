'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  createCollection,
  deleteCollection,
  listCollections,
  updateCollection,
  uploadProductImage,
  type CollectionInput,
  type CollectionRow,
} from '@/lib/data'

type FormState = { title: string; sub_title: string; image_url: string; slug: string; sort_order: number }

const EMPTY_FORM: FormState = { title: '', sub_title: '', image_url: '', slug: '', sort_order: 0 }

export default function AdminCollections() {
  const [list, setList] = useState<CollectionRow[]>([])
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setList(await listCollections())
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
    if (!form.title.trim()) return setError('请填写系列名称')
    if (!form.slug.trim()) return setError('请填写 slug（用于系列页地址）')

    const payload: CollectionInput = {
      title: form.title.trim(),
      sub_title: form.sub_title,
      image_url: form.image_url,
      slug: form.slug.trim(),
      sort_order: Number(form.sort_order) || 0,
    }

    setBusy(true)
    try {
      if (editingId) {
        await updateCollection(editingId, payload)
        setMessage('系列已更新')
      } else {
        await createCollection(payload)
        setMessage('系列已新增')
      }
      resetForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string, title: string) {
    if (!window.confirm(`确定删除「${title}」？关联商品会变为未分类。`)) return
    setBusy(true)
    try {
      await deleteCollection(id)
      if (editingId === id) resetForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    } finally {
      setBusy(false)
    }
  }

  function edit(item: CollectionRow) {
    setEditingId(item.id)
    setForm({
      title: item.title ?? '',
      sub_title: item.sub_title ?? '',
      image_url: item.image_url ?? '',
      slug: item.slug ?? '',
      sort_order: Number(item.sort_order) || 0,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const inputClass = 'w-full border p-2'

  return (
    <section>
      <h1 className="mb-8 text-3xl">Collection Manager</h1>

      {message && <p className="mb-4 text-sm text-oliveDark">{message}</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-10 rounded border bg-white p-6">
        <h2 className="mb-4 text-xl">{editingId ? 'Edit Collection' : 'Add New Collection'}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            系列名称
            <input
              className={`${inputClass} mt-1`}
              value={form.title}
              onChange={(e) => {
                const title = e.target.value
                setForm((prev) => ({
                  ...prev,
                  title,
                  slug: editingId
                    ? prev.slug
                    : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                }))
              }}
            />
          </label>
          <label className="text-sm">
            Sub Title
            <input
              className={`${inputClass} mt-1`}
              value={form.sub_title}
              onChange={(e) => setForm((p) => ({ ...p, sub_title: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Slug（/collections/slug）
            <input
              className={`${inputClass} mt-1`}
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
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
          <div className="text-sm md:col-span-2">
            系列图片
            <input className="mt-1 block" type="file" accept="image/*" onChange={handleUpload} disabled={busy} />
            {form.image_url && (
              // 图片域名不固定，后台预览使用原生 img
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image_url} alt="系列图片预览" className="mt-2 h-32 object-cover" />
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
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_url} alt={item.title} className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 items-center justify-center bg-stone-100 text-xs text-stone-400">无图片</div>
            )}
            <h3 className="mt-3">{item.title}</h3>
            <p className="text-sm">{item.sub_title}</p>
            <p className="text-xs text-stone-500">/collections/{item.slug}</p>
            <div className="mt-3 flex gap-3 text-sm">
              <button onClick={() => edit(item)}>Edit</button>
              <button onClick={() => remove(item.id, item.title)} className="text-red-500">
                Delete
              </button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-stone-500">暂无系列。</p>}
      </div>
    </section>
  )
}
