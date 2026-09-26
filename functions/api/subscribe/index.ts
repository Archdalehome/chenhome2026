import type { Env } from '../../_lib/env'
import { dbError, error, json, readJson, str } from '../../_lib/http'

/** 邮箱格式校验（不做过度严格的正则，避免误拒合法地址） */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** 公开接口：任何访客都可以提交订阅 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson<{ email?: unknown }>(request)
  const email = str(body?.email).toLowerCase()

  if (!email) return error('请输入邮箱地址')
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return error('邮箱格式不正确')

  try {
    // email 上有唯一索引：重复提交不会报错，changes 为 0 即代表已存在
    const result = await env.DB.prepare(
      'insert into email_subscribers (email) values (?) on conflict(email) do nothing',
    )
      .bind(email)
      .run()

    return json({ ok: true, alreadySubscribed: !result.meta.changes })
  } catch (cause) {
    return dbError(cause)
  }
}
