'use client'

import { useCallback, useEffect, useState } from 'react'
import { listHomeContent, updateHomeContent, uploadProductImage, type HomeContentRow } from '@/lib/data'

export default function HomeEditor() {
  const [sections, setSections] = useState<HomeContentRow[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState<HomeContentRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setSections(await listHomeContent())
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !draft) return
    setBusy(true)
    setError('')
    try {
      const url = await uploadProductImage(file)
      setDraft({ ...draft, image_url: url })
      setMessage('图片上传成功，记得点击保存')
    } catch (err) {
      setError(err instanceof Error ? err.message : '图片上传失败')
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    if (!draft) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await updateHomeContent(draft.id, {
        title: draft.title,
        sub_title: draft.sub_title,
        description: draft.description,
        button_text: draft.button_text,
        button_link: draft.button_link,
        image_url: draft.image_url,
      })
      setMessage('已保存')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setBusy(false)
    }
  }

  function selectSection(section: HomeContentRow) {
    setActiveId(section.id)
    setDraft({ ...section })
    setMessage('')
    setError('')
  }

  const inputClass = 'w-full border p-2 mt-1'

  return (
    <section>
      <h1 className="mb-8 text-3xl">Homepage Content Editor</h1>

      {message && <p className="mb-4 text-sm text-oliveDark">{message}</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded border bg-white p-4">
          <h2 className="mb-4 text-lg">Sections</h2>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => selectSection(section)}
              className={`block w-full border-b p-2 text-left hover:bg-stone-100 ${
                activeId === section.id ? 'font-medium text-terracotta' : ''
              }`}
            >
              {section.section_key}
            </button>
          ))}
          {sections.length === 0 && <p className="text-sm text-stone-500">暂无内容，请先执行 database.sql。</p>}
        </div>

        <div className="rounded border bg-white p-6 md:col-span-2">
          {draft ? (
            <>
              <h2 className="mb-4 text-xl">Edit: {draft.section_key}</h2>
              <div className="space-y-4 text-sm">
                <label className="block">
                  Title
                  <input
                    className={inputClass}
                    value={draft.title ?? ''}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  />
                </label>
                <label className="block">
                  Sub Title
                  <input
                    className={inputClass}
                    value={draft.sub_title ?? ''}
                    onChange={(e) => setDraft({ ...draft, sub_title: e.target.value })}
                  />
                </label>
                <label className="block">
                  Description
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={draft.description ?? ''}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  />
                </label>
                <label className="block">
                  Button Text
                  <input
                    className={inputClass}
                    value={draft.button_text ?? ''}
                    onChange={(e) => setDraft({ ...draft, button_text: e.target.value })}
                  />
                </label>
                <label className="block">
                  Button Link
                  <input
                    className={inputClass}
                    value={draft.button_link ?? ''}
                    onChange={(e) => setDraft({ ...draft, button_link: e.target.value })}
                  />
                </label>
                <div>
                  Section Image
                  <input className="mt-1 block" type="file" accept="image/*" onChange={handleUpload} disabled={busy} />
                  {draft.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={draft.image_url} alt="版块图片预览" className="mt-2 h-40 object-cover" />
                  )}
                </div>
                <button onClick={save} disabled={busy} className="bg-terracotta px-4 py-2 text-white disabled:opacity-60">
                  {busy ? '处理中…' : 'Save Section'}
                </button>
              </div>
            </>
          ) : (
            <p className="text-stone-500">Select a section on the left to edit.</p>
          )}
        </div>
      </div>
    </section>
  )
}
