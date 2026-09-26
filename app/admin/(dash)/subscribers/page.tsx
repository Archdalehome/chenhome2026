'use client'

import { useCallback, useEffect, useState } from 'react'
import { listSubscribers, type SubscriberRow } from '@/lib/data'

/** CSV 转义：处理逗号、引号、换行与公式注入 */
function csvCell(value: string) {
  const safe = value.replace(/"/g, '""')
  return /[",\n\r]/.test(safe) ? `"${safe}"` : safe
}

export default function AdminSubscribers() {
  const [list, setList] = useState<SubscriberRow[]>([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setList(await listSubscribers())
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function exportCSV() {
    const rows = [
      'Email,Created At',
      ...list.map((item) => `${csvCell(item.email)},${csvCell(item.created_at)}`),
    ]
    const blob = new Blob([`\uFEFF${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <section>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">Email Subscribers</h1>
        <button
          onClick={exportCSV}
          disabled={list.length === 0}
          className="bg-terracotta px-4 py-2 text-white disabled:opacity-60"
        >
          Export CSV
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-100">
            <tr>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Subscribe Date</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3">{item.email}</td>
                <td className="p-3">{new Date(item.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="p-4 text-stone-500">暂无订阅者。</p>}
      </div>
    </section>
  )
}
