import { requireAdmin } from '../../_lib/auth'
import type { Env, HomeContentRow } from '../../_lib/env'
import { dbError, error, json, nullableStr, readJson, str } from '../../_lib/http'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const { results } = await env.DB.prepare(
      'select * from home_page_content order by section_key asc',
    ).all<HomeContentRow>()
    return json(results ?? [])
  } catch (cause) {
    return dbError(cause)
  }
}

/** 更新某个版块（body 里必须带 id，其余字段可选） */
export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const session = await requireAdmin(request, env)
  if (session instanceof Response) return session

  const body = await readJson<Partial<HomeContentRow>>(request)
  if (!body) return error('请求体必须是 JSON 对象')

  const id = str(body.id)
  if (!id) return error('缺少版块 id')

  try {
    const result = await env.DB.prepare(
      `update home_page_content
       set title = ?, sub_title = ?, description = ?, button_text = ?, button_link = ?,
           image_url = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       where id = ?`,
    )
      .bind(
        nullableStr(body.title),
        nullableStr(body.sub_title),
        nullableStr(body.description),
        nullableStr(body.button_text),
        nullableStr(body.button_link),
        nullableStr(body.image_url),
        id,
      )
      .run()
    if (!result.meta.changes) return error('找不到该版块', 404)
    return json({ ok: true })
  } catch (cause) {
    return dbError(cause)
  }
}
