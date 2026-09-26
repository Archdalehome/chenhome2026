import {
  LOGIN_LOCK_MESSAGE,
  clearLoginFailures,
  clientIp,
  createSessionToken,
  isLockedOut,
  maxIterations,
  readHashIterations,
  recordLoginFailure,
  sessionCookie,
  verifyPasswordOrDummy,
} from '../../_lib/auth'
import type { AdminUserRow, Env } from '../../_lib/env'
import { error, json, readJson, str } from '../../_lib/http'

const MISSING_SECRET = '服务端未配置 SESSION_SECRET 密钥，后台暂不可用（见 README）'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.SESSION_SECRET) return error(MISSING_SECRET, 500)

  const ip = clientIp(request)
  if (await isLockedOut(env, ip)) return error(LOGIN_LOCK_MESSAGE, 429)

  const body = await readJson<{ email?: unknown; password?: unknown }>(request)
  const email = str(body?.email).toLowerCase()
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!email || !password) return error('请输入邮箱和密码')

  let user: AdminUserRow | null = null
  try {
    user = await env.DB.prepare('select id, email, password_hash from admin_users where email = ?')
      .bind(email)
      .first<AdminUserRow>()
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    return error(`数据库查询失败：${message}（是否已执行 schema.sql？）`, 500)
  }

  // CPU 保护：存量哈希的迭代次数若超过当前计划允许的上限，直接返回可读错误，
  // 而不是让请求被 Workers 的 CPU 限额强杀（那样前端只会看到 error code: 1101 / HTTP 500）
  const storedIterations = readHashIterations(user?.password_hash)
  const cap = maxIterations(env)
  if (storedIterations > cap) {
    return error(
      `管理员密码的哈希迭代次数为 ${storedIterations}，超过当前上限 ${cap}（Workers 免费版单请求 CPU 限额 10ms，` +
        `15 万次迭代约需 108ms，会被运行时直接终止）。\n` +
        `解决办法二选一：\n` +
        `① 在本机重新生成密码（推荐）：npm run admin:create -- <邮箱> --iterations=${cap}\n` +
        `② 升级到 Workers Paid（CPU 限额 30s），然后在 Pages 环境变量里设置 PBKDF2_MAX_ITERATIONS=${storedIterations}`,
      500,
    )
  }

  // 账号不存在时同样消耗 PBKDF2 时间，避免通过响应时间枚举管理员邮箱
  const ok = await verifyPasswordOrDummy(password, user?.password_hash)
  if (!user || !ok) {
    await recordLoginFailure(env, ip)
    // 不区分「邮箱不存在」与「密码错误」，避免枚举账号
    return error('邮箱或密码不正确', 401)
  }

  await clearLoginFailures(env, ip)
  const token = await createSessionToken(env, user.email)

  return json({ authenticated: true, email: user.email }, 200, {
    'Set-Cookie': sessionCookie(request, token),
  })
}
