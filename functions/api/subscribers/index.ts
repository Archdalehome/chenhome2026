import { requireAdmin } from '../../_lib/auth'
import type { Env } from '../../_lib/env'
import { dbError, json } from '../../_lib/http'

type SubscriberRow = {
  id: string
  email: string
  created_at: string
}

/** 仅管理员可读：订阅者名单属于个人信息 */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const session = await requireAdmin(request, env)
  if (session instanceof Response) return session

  try {
    const { results } = await env.DB.prepare(
      'select id, email, created_at from email_subscribers order by created_at desc',
    ).all<SubscriberRow>()
    return json(results ?? [])
  } catch (cause) {
    return dbError(cause)
  }
}
