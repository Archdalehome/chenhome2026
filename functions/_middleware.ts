import type { Env } from './_lib/env'

/**
 * 全局兜底：把未捕获的异常转成 JSON 错误。
 *
 * Cloudflare 在 Worker 抛异常时默认返回纯文本 `error code: 1101`，
 * 前端拿到非 JSON 响应只能显示“请求失败（HTTP 500）”，看不出原因。
 * 有了这层兜底，前端就能把真实错误直接展示出来。
 *
 * 注意：真正被 CPU 限额强杀的请求无法被 JS 捕获（见 auth.ts 里的迭代次数上限保护）。
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  try {
    return await context.next()
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    return new Response(
      JSON.stringify({
        error: `接口内部错误：${message}`,
        hint: '常见原因：1) 未配置 SESSION_SECRET；2) 未绑定 D1(DB) / R2(BUCKET)；3) 密码哈希超出 Workers 计划的 CPU 限额。详见 README「常见问题」。',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    )
  }
}
