import { clearSessionCookie } from '../../_lib/auth'
import type { Env } from '../../_lib/env'
import { json } from '../../_lib/http'

/** 退出登录：清空会话 Cookie（服务端无状态，无需查库） */
export const onRequestPost: PagesFunction<Env> = async ({ request }) => {
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie(request) })
}
