/**
 * 鉴权：PBKDF2-SHA256 密码校验 + HMAC 签名的无状态会话 Cookie + 登录失败限流。
 *
 * 哈希格式（必须与 scripts/create-admin.mjs 保持一致）：
 *   pbkdf2$<迭代次数>$<salt base64url>$<hash base64url>
 */
import type { AdminUserRow, Env } from './env'
import { error } from './http'

const PBKDF2_ITERATIONS = 150000
const PBKDF2_KEY_BYTES = 32
const SALT_BYTES = 16

export const SESSION_COOKIE = 'casa_session'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

const LOGIN_MAX_ATTEMPTS = 8
const LOGIN_WINDOW_MS = 15 * 60 * 1000

const encoder = new TextEncoder()

/** 语法合法但永不匹配的哈希：用户不存在时也走一遍 PBKDF2，避免用响应时间枚举邮箱 */
const DUMMY_HASH = `pbkdf2$${PBKDF2_ITERATIONS}$${'A'.repeat(22)}$${'A'.repeat(43)}`

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    key,
    PBKDF2_KEY_BYTES * 8,
  )
  return new Uint8Array(bits)
}

/** 校验密码（恒定时间比较） */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false

  const iterations = Number(parts[1])
  if (!Number.isInteger(iterations) || iterations < 10000) return false

  let salt: Uint8Array
  let expected: Uint8Array
  try {
    salt = fromBase64Url(parts[2])
    expected = fromBase64Url(parts[3])
  } catch {
    return false
  }
  if (salt.length !== SALT_BYTES || expected.length !== PBKDF2_KEY_BYTES) return false

  const actual = await pbkdf2(password, salt, iterations)
  let diff = 0
  for (let i = 0; i < actual.length; i += 1) diff |= actual[i] ^ expected[i]
  return diff === 0
}

export type Session = {
  email: string
  exp: number
}

/**
 * 默认允许校验的最大迭代次数。
 * Workers 免费版单请求 CPU 限额 10ms，而 PBKDF2 在 workerd 上约 0.6μs/次迭代
 * （实测：1 万次≈6ms、2.5 万次≈34ms、15 万次≈108ms），故上限取 15000（≈9ms）。
 * 升级到 Workers Paid（CPU 30s）后可把 PBKDF2_MAX_ITERATIONS 调大。
 */
export const DEFAULT_MAX_ITERATIONS = 15000

/** 从存储的哈希串读出迭代次数；格式非法返回 0 */
export function readHashIterations(stored: string | null | undefined): number {
  if (!stored) return 0
  const value = Number(stored.split('$')[1])
  return Number.isInteger(value) && value > 0 ? value : 0
}

/** 读取 env 中配置的迭代次数上限（非法或未配置则用默认值） */
export function maxIterations(env: Env): number {
  const configured = Number(env.PBKDF2_MAX_ITERATIONS)
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_ITERATIONS
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ])
}

/** 生成会话令牌：base64url(payload).base64url(HMAC-SHA256) */
export async function createSessionToken(env: Env, email: string): Promise<string> {
  const payload: Session = { email, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)))
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', await hmacKey(env.SESSION_SECRET), encoder.encode(body)),
  )
  return `${body}.${toBase64Url(signature)}`
}

function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index === -1) continue
    if (part.slice(0, index).trim() === name) return decodeURIComponent(part.slice(index + 1).trim())
  }
  return null
}

/** 读取并校验会话；无效/过期返回 null */
export async function readSession(request: Request, env: Env): Promise<Session | null> {
  if (!env.SESSION_SECRET) return null

  const token = getCookie(request, SESSION_COOKIE)
  if (!token) return null

  const [body, signature] = token.split('.')
  if (!body || !signature) return null

  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(env.SESSION_SECRET),
      fromBase64Url(signature) as BufferSource,
      encoder.encode(body),
    )
    if (!valid) return null

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as Session
    if (!payload?.email || typeof payload.exp !== 'number') return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

/**
 * 校验密码；账号不存在（stored 为空）时也消耗同样的 PBKDF2 时间，
 * 返回 false，避免通过响应时间枚举出哪些邮箱是管理员。
 */
export async function verifyPasswordOrDummy(password: string, stored: string | null | undefined): Promise<boolean> {
  const ok = await verifyPassword(password, stored ?? DUMMY_HASH)
  return Boolean(stored) && ok
}

/* ------------------------------ Cookie ------------------------------ */

function isSecureRequest(request: Request): boolean {
  return new URL(request.url).protocol === 'https:'
}

export function sessionCookie(request: Request, token: string, maxAge = SESSION_TTL_SECONDS): string {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ]
  // 本地 `wrangler pages dev` 走 http://localhost，带 Secure 会被浏览器丢弃
  if (isSecureRequest(request)) parts.push('Secure')
  return parts.join('; ')
}

export function clearSessionCookie(request: Request): string {
  return sessionCookie(request, '', 0)
}

/* ----------------------------- 权限校验 ----------------------------- */

const MISSING_SECRET_MESSAGE = '服务端未配置 SESSION_SECRET 密钥，后台暂不可用（见 README）'

/** 通过返回 Session；未通过返回可直接 return 的 Response */
export async function requireAdmin(request: Request, env: Env): Promise<Session | Response> {
  if (!env.SESSION_SECRET) return error(MISSING_SECRET_MESSAGE, 500)

  const session = await readSession(request, env)
  if (!session) return error('未登录或登录已过期，请重新登录', 401)

  // 账号被移出 admin_users 后立即失效
  const row = await env.DB.prepare('select id from admin_users where email = ?').bind(session.email).first()
  if (!row) return error('该账号已无管理权限', 403)

  return session
}

/* ---------------------------- 登录限流 ----------------------------- */

export function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ?? request.headers.get('X-Forwarded-For') ?? 'unknown'
}

export async function isLockedOut(env: Env, ip: string): Promise<boolean> {
  const row = await env.DB.prepare('select count, first_at from login_attempts where ip = ?')
    .bind(ip)
    .first<{ count: number; first_at: number }>()
  if (!row) return false
  if (Date.now() - Number(row.first_at) > LOGIN_WINDOW_MS) return false
  return Number(row.count) >= LOGIN_MAX_ATTEMPTS
}

export async function recordLoginFailure(env: Env, ip: string): Promise<void> {
  const now = Date.now()
  const staleBefore = now - LOGIN_WINDOW_MS
  await env.DB.prepare(
    `insert into login_attempts (ip, count, first_at) values (?, 1, ?)
     on conflict(ip) do update set
       count = case when first_at < ? then 1 else count + 1 end,
       first_at = case when first_at < ? then ? else first_at end`,
  )
    .bind(ip, now, staleBefore, staleBefore, now)
    .run()
}

export async function clearLoginFailures(env: Env, ip: string): Promise<void> {
  await env.DB.prepare('delete from login_attempts where ip = ?').bind(ip).run()
}

export const LOGIN_LOCK_MESSAGE = `登录失败次数过多，请 ${LOGIN_WINDOW_MS / 60000} 分钟后再试`
