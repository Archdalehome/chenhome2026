import { readSession } from '../../_lib/auth'
import type { Env } from '../../_lib/env'
import { json } from '../../_lib/http'

/** 前台用它判断后台是否需要跳转登录页 */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const session = await readSession(request, env)
  return json({ authenticated: Boolean(session), email: session?.email ?? null })
}
