#!/usr/bin/env node
/**
 * 创建或重置管理员账号。
 *
 *   npm run admin:create -- you@example.com            # 写入线上 D1
 *   npm run admin:create -- you@example.com --local    # 写入本地模拟的 D1（wrangler pages dev 用）
 *
 * 密码在本地用 PBKDF2-SHA256 哈希，算法与 functions/_lib/auth.ts 完全一致
 * （pbkdf2$迭代次数$salt$hash，base64url）。只有哈希会写入 D1，明文密码不落盘、不上传。
 *
 * 若设置了环境变量 ADMIN_PASSWORD，则不再交互式询问密码（便于脚本化）。
 */
import { pbkdf2Sync, randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { rmSync, writeFileSync } from 'node:fs'
import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'

const DB_NAME = 'chenhome-db'
// 远程命令使用这份「不含 D1 绑定」的配置，强制按数据库名走 API 解析，
// 避免读到根目录本地配置里的占位 database_id（会报 Invalid uuid）
const REMOTE_CONFIG = 'dev/wrangler.remote.jsonc'
const ITERATIONS = 150000
const SALT_BYTES = 16
const KEY_BYTES = 32
const SQL_FILE = './.create-admin.sql'

const args = process.argv.slice(2)
const useLocal = args.includes('--local')
const email = (args.find((arg) => !arg.startsWith('--')) ?? '').trim().toLowerCase()

if (!email) {
  console.error('用法：npm run admin:create -- you@example.com [--local]')
  process.exit(1)
}

let password = process.env.ADMIN_PASSWORD ?? ''
if (!password) {
  const rl = createInterface({ input: stdin, output: stdout })
  password = (await rl.question(`为 ${email} 设置密码（至少 8 位）：`)).trim()
  rl.close()
}

if (password.length < 8) {
  console.error('✗ 密码至少需要 8 位')
  process.exit(1)
}

const base64url = (buffer) =>
  buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const salt = randomBytes(SALT_BYTES)
const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_BYTES, 'sha256')
const stored = `pbkdf2$${ITERATIONS}$${base64url(salt)}$${base64url(hash)}`

const sql =
  `insert into admin_users (email, password_hash) values ('${email}', '${stored}')\n` +
  `on conflict(email) do update set password_hash = excluded.password_hash;\n`

writeFileSync(SQL_FILE, sql, 'utf8')

const wranglerArgs = [
  'wrangler',
  'd1',
  'execute',
  DB_NAME,
  // 本地模式用根目录的 wrangler.jsonc（由 npm run dev:setup 生成）；
  // 远程模式用不含 D1 绑定的配置，按库名解析
  ...(useLocal ? ['--local'] : ['-c', REMOTE_CONFIG, '--remote']),
  `--file=${SQL_FILE}`,
]

console.log(`\n→ 正在写入 ${useLocal ? '本地模拟' : '线上'} D1：${DB_NAME}\n`)

const result = spawnSync('npx', wranglerArgs, { stdio: 'inherit', shell: true })

if (result.status === 0) {
  rmSync(SQL_FILE, { force: true })
  console.log(`\n✓ 完成：${email} 现在可以用该密码登录 /admin/login`)
} else {
  console.error('\n✗ 自动执行 wrangler 失败。常见原因：')
  console.error('  1) 还没登录 Cloudflare：先执行  npx wrangler login')
  console.error(`  2) 线上还没有 D1 数据库：先执行  npx wrangler d1 create ${DB_NAME}`)
  console.error('  3) 名字不一致：库名与 DB_NAME 必须相同\n')
  console.error('也可以手动执行下面这条命令：\n')
  console.error(`  npx wrangler d1 execute ${DB_NAME} ${wranglerArgs.slice(4, -1).join(' ')} --file=${SQL_FILE}\n`)
  console.error('执行成功后请删除该文件（内含密码哈希，切勿提交）：')
  console.error(`  del ${SQL_FILE}      # macOS/Linux: rm ${SQL_FILE}\n`)
  process.exit(1)
}
