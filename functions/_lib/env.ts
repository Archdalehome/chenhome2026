/**
 * Pages Functions 的绑定与环境类型、以及数据库行/入参类型。
 *
 * 注意：这里的类型刻意不跨目录共享（不 import 前端 lib/ 里的类型），
 * 以免 functions 的打包器与前端 tsconfig 相互牵连；只保留必要的小份重复。
 */

export interface Env {
  /** D1 数据库绑定（Pages 控制台里绑定名必须是 DB） */
  DB: D1Database
  /** R2 存储桶绑定（绑定名必须是 BUCKET） */
  BUCKET: R2Bucket
  /** 会话签名密钥（Worker Secret，建议 32 位以上随机串） */
  SESSION_SECRET: string
}

export type ProductRow = {
  id: string
  name: string
  price: number
  description: string | null
  detail: string | null
  image_url: string
  collection_id: string | null
  is_featured: number
  slug: string
  sort_order: number
  created_at: string
}

export type ProductInput = {
  name?: unknown
  price?: unknown
  description?: unknown
  detail?: unknown
  image_url?: unknown
  collection_id?: unknown
  is_featured?: unknown
  slug?: unknown
  sort_order?: unknown
}

export type CollectionRow = {
  id: string
  title: string
  sub_title: string | null
  image_url: string | null
  slug: string
  sort_order: number
  created_at: string
}

export type CollectionInput = {
  title?: unknown
  sub_title?: unknown
  image_url?: unknown
  slug?: unknown
  sort_order?: unknown
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
  updated_at: string
}

export type AdminUserRow = {
  id: string
  email: string
  password_hash: string
}
