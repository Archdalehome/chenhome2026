// ⚠️ 临时诊断用，量完立即删除（不属于正式功能）
import type { Env } from '../_lib/env'
import { json } from '../_lib/http'

/**
 * 在真实生产运行时测量 PBKDF2 的 CPU 成本，用来确定 Workers 免费版(10ms CPU)可用的迭代次数。
 * 用法：/api/bench-probe?n=10000
 */
export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const n = Number(new URL(request.url).searchParams.get('n') ?? '10000')
  if (!Number.isFinite(n) || n < 1 || n > 200000) return json({ error: 'n 需在 1..200000' }, 400)

  const enc = new TextEncoder()
  const start = Date.now()

  try {
    const key = await crypto.subtle.importKey('raw', enc.encode('correct horse'), 'PBKDF2', false, ['deriveBits'])
    await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode('0123456789abcdef'), iterations: n, hash: 'SHA-256' },
      key,
      256,
    )
    return json({ ok: true, iterations: n, ms: Date.now() - start })
  } catch (cause) {
    return json({ ok: false, iterations: n, ms: Date.now() - start, error: String(cause) })
  }
}
