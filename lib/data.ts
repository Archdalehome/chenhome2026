/**
 * 数据访问层：直接调用 Supabase（浏览器端 anon key + RLS 鉴权）
 *
 * 说明：本项目的 API Routes（app/api/**）在 `output: 'export'` 静态导出下不可用，
 * 因此统一改为前端直连 Supabase。anon key 本身是公开的，
 * 真正的权限边界由 database.sql 中的 RLS 策略 + admin_users 白名单保证。
 */
import { getSupabase } from './supabase'

export type ProductRow = {
  id: string
  name: string
  price: number
  image_url: string
  description: string | null
  detail: string | null
  slug: string | null
  collection_id: string | null
  is_featured: boolean | null
  sort_order: number | null
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
  sort_order: number | null
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

export const IMAGE_BUCKET = 'product-images'

function fail(error: { message: string } | null): never {
  throw new Error(error?.message || '操作失败，请稍后重试。')
}

/* ------------------------------- 商品 ------------------------------- */

export async function listProducts(): Promise<ProductRow[]> {
  const { data, error } = await getSupabase()
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) fail(error)
  return (data ?? []) as ProductRow[]
}

export async function createProduct(input: ProductInput): Promise<void> {
  const { error } = await getSupabase().from('products').insert([input])
  if (error) fail(error)
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  const { error } = await getSupabase().from('products').update(input).eq('id', id)
  if (error) fail(error)
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await getSupabase().from('products').delete().eq('id', id)
  if (error) fail(error)
}

/* ------------------------------- 系列 ------------------------------- */

export async function listCollections(): Promise<CollectionRow[]> {
  const { data, error } = await getSupabase()
    .from('collections')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) fail(error)
  return (data ?? []) as CollectionRow[]
}

export async function createCollection(input: CollectionInput): Promise<void> {
  const { error } = await getSupabase().from('collections').insert([input])
  if (error) fail(error)
}

export async function updateCollection(id: string, input: CollectionInput): Promise<void> {
  const { error } = await getSupabase().from('collections').update(input).eq('id', id)
  if (error) fail(error)
}

export async function deleteCollection(id: string): Promise<void> {
  const { error } = await getSupabase().from('collections').delete().eq('id', id)
  if (error) fail(error)
}

/* ----------------------------- 首页内容 ----------------------------- */

export async function listHomeContent(): Promise<HomeContentRow[]> {
  const { data, error } = await getSupabase().from('home_page_content').select('*')
  if (error) fail(error)
  return (data ?? []) as HomeContentRow[]
}

export async function updateHomeContent(id: string, patch: Partial<HomeContentRow>): Promise<void> {
  const { error } = await getSupabase().from('home_page_content').update(patch).eq('id', id)
  if (error) fail(error)
}

/* ------------------------------- 订阅 ------------------------------- */

export async function subscribeEmail(email: string): Promise<void> {
  const { error } = await getSupabase().from('email_subscribers').insert([{ email }])
  if (error) {
    if (error.code === '23505') throw new Error('这个邮箱已经订阅过了 🙂')
    fail(error)
  }
}

export async function listSubscribers(): Promise<SubscriberRow[]> {
  const { data, error } = await getSupabase()
    .from('email_subscribers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) fail(error)
  return (data ?? []) as SubscriberRow[]
}

/* ------------------------------- 上传 ------------------------------- */

export async function uploadProductImage(file: File): Promise<string> {
  const supabase = getSupabase()
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { cacheControl: '31536000', upsert: false })
  if (error) fail(error)

  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl
}

/* ------------------------------- 鉴权 ------------------------------- */

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithPassword({ email, password })
  if (error) fail(error)
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut()
}

/** 返回 true 表示当前已有管理员会话 */
export async function hasActiveSession(): Promise<boolean> {
  const { data } = await getSupabase().auth.getSession()
  return Boolean(data.session)
}
