import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/** 是否已配置 Supabase 环境变量 */
export const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0

export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  'Supabase 未配置：请在 .env.local（本地）或 Cloudflare Pages 的环境变量中设置 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY。'

let client: SupabaseClient | null = null

/**
 * 懒加载 Supabase 客户端。
 * 采用懒加载而不是模块顶层 createClient，是为了让缺少环境变量时
 * 也不影响纯静态页面（否则整个站点会在浏览器端直接抛错白屏）。
 */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) throw new Error(SUPABASE_NOT_CONFIGURED_MESSAGE)
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  }
  return client
}
