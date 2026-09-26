import { requireAdmin } from '../../_lib/auth'
import type { CollectionInput, CollectionRow, Env } from '../../_lib/env'
import { dbError, error, json, num, nullableStr, readJson, str } from '../../_lib/http'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

type Payload = {
  title: string
  subTitle: string | null
  imageUrl: string | null
  slug: string
  sortOrder: number
}

function parseBody(body: CollectionInput | null): Payload | string {
  if (!body || typeof body !== 'object') return '请求体必须是 JSON 对象'

  const title = str(body.title)
  if (!title) return '系列名称不能为空'

  const slug = slugify(str(body.slug) || title)
  if (!slug) return 'slug 不能为空（只能包含字母、数字和连字符）'

  return {
    title,
    subTitle: nullableStr(body.sub_title),
    imageUrl: nullableStr(body.image_url),
    slug,
    sortOrder: Math.trunc(num(body.sort_order)),
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const { results } = await env.DB.prepare(
      'select * from collections order by sort_order asc, created_at asc',
    ).all<CollectionRow>()
    return json(results ?? [])
  } catch (cause) {
    return dbError(cause)
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const session = await requireAdmin(request, env)
  if (session instanceof Response) return session

  const payload = parseBody(await readJson<CollectionInput>(request))
  if (typeof payload === 'string') return error(payload)

  try {
    await env.DB.prepare(
      'insert into collections (title, sub_title, image_url, slug, sort_order) values (?, ?, ?, ?, ?)',
    )
      .bind(payload.title, payload.subTitle, payload.imageUrl, payload.slug, payload.sortOrder)
      .run()
    return json({ ok: true }, 201)
  } catch (cause) {
    return dbError(cause)
  }
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const session = await requireAdmin(request, env)
  if (session instanceof Response) return session

  const body = await readJson<CollectionInput & { id?: unknown }>(request)
  const id = str(body?.id)
  if (!id) return error('缺少系列 id')

  const payload = parseBody(body)
  if (typeof payload === 'string') return error(payload)

  try {
    const result = await env.DB.prepare(
      'update collections set title = ?, sub_title = ?, image_url = ?, slug = ?, sort_order = ? where id = ?',
    )
      .bind(payload.title, payload.subTitle, payload.imageUrl, payload.slug, payload.sortOrder, id)
      .run()
    if (!result.meta.changes) return error('找不到该系列', 404)
    return json({ ok: true })
  } catch (cause) {
    return dbError(cause)
  }
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const session = await requireAdmin(request, env)
  if (session instanceof Response) return session

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return error('缺少系列 id')

  try {
    // 外键是 on delete set null：删系列后商品变成未分类，不会被一起删掉
    const result = await env.DB.prepare('delete from collections where id = ?').bind(id).run()
    if (!result.meta.changes) return error('找不到该系列', 404)
    return json({ ok: true })
  } catch (cause) {
    return dbError(cause)
  }
}
