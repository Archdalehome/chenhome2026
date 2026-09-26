import type { Env } from '../../_lib/env'
import { error } from '../../_lib/http'

const CACHE_CONTROL = 'public, max-age=31536000, immutable'

/**
 * 从 R2 读图并返回。key 里含有斜杠（如 2026-09-26/xxx.png），
 * 所以用 [[key]] 多段通配路由。
 *
 * 这样图片与站点同源：不需要给 R2 绑自定义域名，也不用开 r2.dev 公开地址。
 *
 * 用 onRequest 而不是 onRequestGet：同时支持 GET 与 HEAD。
 * 若只导出 onRequestGet，HEAD 请求不会被函数处理、而是落到静态资源并返回 404 页面。
 */
export const onRequest: PagesFunction<Env> = async ({ params, request, env }) => {
  const method = request.method.toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') {
    return error('该地址只支持 GET / HEAD 请求', 405)
  }
  const isHead = method === 'HEAD'

  const raw = params.key
  const key = Array.isArray(raw) ? raw.join('/') : raw
  if (!key) return error('缺少图片 key', 400)

  let object: R2Object | null
  try {
    // HEAD 只需要元信息，用 head() 避免把对象内容读出来
    object = isHead ? await env.BUCKET.head(key) : await env.BUCKET.get(key)
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    return error(`读取图片失败：${message}`, 500)
  }
  if (!object) return error('图片不存在', 404)

  const etag = object.httpEtag
  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag, 'Cache-Control': CACHE_CONTROL } })
  }

  // isHead 为 false 时 get() 返回的是带 body 的 R2ObjectBody，这里做一次显式断言
  const body: ReadableStream | null = isHead ? null : (object as R2ObjectBody).body

  return new Response(body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Content-Length': String(object.size),
      'Cache-Control': CACHE_CONTROL,
      ETag: etag,
      // 图片不允许被当成其他类型解析，也不给任何脚本执行权限
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  })
}
