import { requireAdmin } from '../../_lib/auth'
import type { Env, ProductInput, ProductRow } from '../../_lib/env'
import { bool01, dbError, error, json, num, nullableStr, readJson, str } from '../../_lib/http'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

type Payload = {
  name: string
  price: number
  description: string | null
  detail: string | null
  imageUrl: string
  collectionId: string | null
  featured: number
  slug: string
  sortOrder: number
}

/** 校验并规范化入参；返回字符串表示校验失败原因 */
function parseBody(body: ProductInput | null): Payload | string {
  if (!body || typeof body !== 'object') return '请求体必须是 JSON 对象'

  const name = str(body.name)
  if (!name) return '商品名称不能为空'

  const imageUrl = str(body.image_url)
  if (!imageUrl) return '请先上传图片或填写图片地址'

  const slug = slugify(str(body.slug) || name)
  if (!slug) return 'slug 不能为空（只能包含字母、数字和连字符）'

  return {
    name,
    price: num(body.price),
    description: nullableStr(body.description),
    detail: nullableStr(body.detail),
    imageUrl,
    collectionId: nullableStr(body.collection_id),
    featured: bool01(body.is_featured),
    slug,
    sortOrder: Math.trunc(num(body.sort_order)),
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const { results } = await env.DB.prepare(
      'select * from products order by sort_order asc, created_at asc',
    ).all<ProductRow>()
    return json(results ?? [])
  } catch (cause) {
    return dbError(cause)
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const session = await requireAdmin(request, env)
  if (session instanceof Response) return session

  const payload = parseBody(await readJson<ProductInput>(request))
  if (typeof payload === 'string') return error(payload)

  try {
    await env.DB.prepare(
      `insert into products (name, price, description, detail, image_url, collection_id, is_featured, slug, sort_order)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        payload.name,
        payload.price,
        payload.description,
        payload.detail,
        payload.imageUrl,
        payload.collectionId,
        payload.featured,
        payload.slug,
        payload.sortOrder,
      )
      .run()
    return json({ ok: true }, 201)
  } catch (cause) {
    return dbError(cause)
  }
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const session = await requireAdmin(request, env)
  if (session instanceof Response) return session

  const body = await readJson<ProductInput & { id?: unknown }>(request)
  const id = str(body?.id)
  if (!id) return error('缺少商品 id')

  const payload = parseBody(body)
  if (typeof payload === 'string') return error(payload)

  try {
    const result = await env.DB.prepare(
      `update products
       set name = ?, price = ?, description = ?, detail = ?, image_url = ?,
           collection_id = ?, is_featured = ?, slug = ?, sort_order = ?
       where id = ?`,
    )
      .bind(
        payload.name,
        payload.price,
        payload.description,
        payload.detail,
        payload.imageUrl,
        payload.collectionId,
        payload.featured,
        payload.slug,
        payload.sortOrder,
        id,
      )
      .run()
    if (!result.meta.changes) return error('找不到该商品', 404)
    return json({ ok: true })
  } catch (cause) {
    return dbError(cause)
  }
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const session = await requireAdmin(request, env)
  if (session instanceof Response) return session

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return error('缺少商品 id')

  try {
    const result = await env.DB.prepare('delete from products where id = ?').bind(id).run()
    if (!result.meta.changes) return error('找不到该商品', 404)
    return json({ ok: true })
  } catch (cause) {
    return dbError(cause)
  }
}
