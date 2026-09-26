import { requireAdmin } from '../../_lib/auth'
import type { Env } from '../../_lib/env'
import { error, json } from '../../_lib/http'

const MAX_BYTES = 5 * 1024 * 1024

/**
 * MIME → 扩展名白名单。
 * 扩展名完全由服务端决定，不采用客户端文件名（防路径穿越 / 伪造后缀）。
 * 不接受 SVG：SVG 内含脚本时可能造成同源 XSS。
 */
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const session = await requireAdmin(request, env)
  if (session instanceof Response) return session

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return error('请使用 multipart/form-data 上传文件')
  }

  const file = form.get('file')
  if (!(file instanceof File)) return error('缺少文件字段 file')
  if (file.size === 0) return error('文件内容为空')
  if (file.size > MAX_BYTES) return error('图片不能超过 5 MB')

  const ext = ALLOWED_TYPES[file.type]
  if (!ext) return error('只支持 PNG / JPEG / WebP / AVIF / GIF 格式')

  const key = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`

  try {
    await env.BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    })
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    return error(`图片上传失败：${message}。若提示 R2 未启用，请先创建并绑定 R2 存储桶（见 README）`, 500)
  }

  // 返回站内路径：前端不需要知道 R2 的域名
  return json({ url: `/api/images/${key}`, key }, 201)
}
