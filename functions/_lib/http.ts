/** 统一的 JSON 响应与入参解析工具 */

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data ?? null), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  })
}

export function error(message: string, status = 400): Response {
  return json({ error: message }, status)
}

/** 读取 JSON body；非法 JSON 返回 null 而不抛错 */
export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    const contentType = request.headers.get('Content-Type') ?? ''
    if (!contentType.includes('application/json')) return null
    return (await request.json()) as T
  } catch {
    return null
  }
}

export function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

export function nullableStr(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = typeof value === 'string' ? value.trim() : ''
  return text === '' ? null : text
}

export function num(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function bool01(value: unknown): number {
  return value === true || value === 1 || value === '1' || value === 'true' ? 1 : 0
}

/** 把 D1/SQLite 的约束错误翻译成可读提示 */
export function dbError(cause: unknown): Response {
  const message = cause instanceof Error ? cause.message : String(cause)
  if (message.includes('UNIQUE constraint failed')) return error('该 slug 已存在，请换一个', 409)
  if (message.includes('NOT NULL constraint failed')) return error('有必填字段为空', 400)
  if (message.includes('FOREIGN KEY constraint failed')) return error('关联的系列不存在', 400)
  if (message.includes('no such table')) return error('数据库尚未初始化，请先执行 schema.sql', 500)
  return error(`数据库错误：${message}`, 500)
}

/** 只允许跳转到本站路径，避免被当成开放重定向 */
export function safePath(value: unknown, fallback = '/'): string {
  const path = str(value)
  return path.startsWith('/') && !path.startsWith('//') ? path : fallback
}
