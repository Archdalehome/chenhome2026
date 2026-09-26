/**
 * 前端数据访问层：调用同源的 Pages Functions（functions/api/**）。
 *
 * 后端由 Cloudflare 提供：
 *   - D1（SQLite）存商品 / 系列 / 首页文案 / 订阅者 / 管理员
 *   - R2 存上传的图片，经 /api/images/<key> 同源读取
 *   - SESSION_SECRET + HttpOnly Cookie 做后台登录会话
 *
 * 导出的函数名与参数与旧版（Supabase 版）保持一致，页面组件无需改动。
 */

/* ----------------------------- 类型 ----------------------------- */

export type ProductRow = {
  id: string
  name: string
  price: number
  image_url: string
  description: string | null
  detail: string | null
  slug: string
  collection_id: string | null
  is_featured: number
  sort_order: number
  created_at?: string
}

export type ProductInput = {
  name: string
  price: number
  image_url: string
  description?: string
  detail?: string
  slug?: string
  collection_id?: string | null
  is_featured?: boolean
  sort_order?: number
}

export type CollectionRow = {
  id: string
  title: string
  sub_title: string | null
  image_url: string | null
  slug: string
  sort_order: number
  created_at?: string
}

export type CollectionInput = {
  title: string
  sub_title?: string
  image_url?: string
  slug: string
  sort_order?: number
}

export type HomeContentRow = {
  id: string
  section_key: string
  title: string | null
  sub_title: string | null
  description: string | null
  button_text: string | null
  button_link: string | null
  image_url: string | null
}

export type SubscriberRow = {
  id: string
  email: string
  created_at: string
}

/* -------------------------- 请求封装 ---------------------------- */

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, { credentials: 'same-origin', cache: 'no-store', ...init })
  } catch {
    throw new Error('无法连接后端接口，请确认部署时包含 functions/ 目录（见 README）')
  }

  const contentType = response.headers.get('Content-Type') ?? ''
  const payload = contentType.includes('application/json')
    ? ((await response.json().catch(() => null)) as { error?: string } | null)
    : null

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('接口不存在（404）：部署时可能漏掉了 functions/ 目录，或该路径未被 /api/* 路由覆盖')
    }
    throw new Error(payload?.error || `请求失败（HTTP ${response.status}）`)
  }

  return payload as T
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  }
}

/* ------------------------------ 商品 ---------------------------- */

export async function listProducts(): Promise<ProductRow[]> {
  return (await api<ProductRow[]>('/api/products')) ?? []
}

export async function createProduct(input: ProductInput): Promise<void> {
  await api('/api/products', jsonInit('POST', input))
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  await api('/api/products', jsonInit('PUT', { ...input, id }))
}

export async function deleteProduct(id: string): Promise<void> {
  await api(`/api/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/* ------------------------------ 系列 ---------------------------- */

export async function listCollections(): Promise<CollectionRow[]> {
  return (await api<CollectionRow[]>('/api/collections')) ?? []
}

export async function createCollection(input: CollectionInput): Promise<void> {
  await api('/api/collections', jsonInit('POST', input))
}

export async function updateCollection(id: string, input: CollectionInput): Promise<void> {
  await api('/api/collections', jsonInit('PUT', { ...input, id }))
}

export async function deleteCollection(id: string): Promise<void> {
  await api(`/api/collections?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/* ---------------------------- 首页内容 --------------------------- */

export async function listHomeContent(): Promise<HomeContentRow[]> {
  return (await api<HomeContentRow[]>('/api/home-content')) ?? []
}

export async function updateHomeContent(id: string, patch: Partial<HomeContentRow>): Promise<void> {
  await api('/api/home-content', jsonInit('PUT', { ...patch, id }))
}

/* ------------------------------ 订阅 ----------------------------- */

export async function subscribeEmail(email: string): Promise<{ alreadySubscribed: boolean }> {
  const result = await api<{ alreadySubscribed: boolean }>('/api/subscribe', jsonInit('POST', { email }))
  return { alreadySubscribed: Boolean(result?.alreadySubscribed) }
}

export async function listSubscribers(): Promise<SubscriberRow[]> {
  return (await api<SubscriberRow[]>('/api/subscribers')) ?? []
}

/* ---------------------------- 图片上传 --------------------------- */

/** 上传到 R2，返回站内地址（/api/images/...） */
export async function uploadProductImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const result = await api<{ url: string }>('/api/upload', { method: 'POST', body: form })
  if (!result?.url) throw new Error('上传成功但未返回图片地址')
  return result.url
}

/* ------------------------------ 鉴权 ----------------------------- */

export async function signInWithEmail(email: string, password: string): Promise<void> {
  await api('/api/auth/login', jsonInit('POST', { email, password }))
}

export async function signOut(): Promise<void> {
  await api('/api/auth/logout', { method: 'POST' })
}

export async function hasActiveSession(): Promise<boolean> {
  const result = await api<{ authenticated: boolean }>('/api/auth/session')
  return Boolean(result?.authenticated)
}
