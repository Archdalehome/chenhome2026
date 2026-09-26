-- ============================================================
-- Chen Furniture — Cloudflare D1 (SQLite) 建表 + 种子数据
-- 幂等：可重复执行
--
-- 线上执行：npm run db:init        (= wrangler d1 execute chenhome-db --remote --file=./schema.sql)
-- 本地执行：npm run db:init:local  (= wrangler d1 execute chenhome-db --local  --file=./schema.sql)
-- ============================================================

-- 1. 表结构 ----------------------------------------------------

create table if not exists collections (
  id text primary key default (lower(hex(randomblob(16)))),
  title text not null,
  sub_title text,
  image_url text,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) strict;

create table if not exists products (
  id text primary key default (lower(hex(randomblob(16)))),
  name text not null,
  price real not null default 0,
  description text,
  detail text,
  image_url text not null default '',
  collection_id text references collections(id) on delete set null,
  is_featured integer not null default 0,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) strict;

create table if not exists home_page_content (
  id text primary key default (lower(hex(randomblob(16)))),
  section_key text not null unique,
  title text,
  sub_title text,
  description text,
  button_text text,
  button_link text,
  image_url text,
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) strict;

create table if not exists email_subscribers (
  id text primary key default (lower(hex(randomblob(16)))),
  email text not null unique,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) strict;

-- 管理员：邮箱 + PBKDF2-SHA256 密码哈希
-- 哈希由 `npm run admin:create -- <email>` 本地生成，密码不会离开你的机器
create table if not exists admin_users (
  id text primary key default (lower(hex(randomblob(16)))),
  email text not null unique,
  password_hash text not null,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) strict;

-- 登录失败计数（按 IP 限流，防暴力破解）
-- first_at 存毫秒时间戳（整数），避免 SQLite 日期解析歧义
create table if not exists login_attempts (
  ip text primary key,
  count integer not null default 0,
  first_at integer not null
) strict;

create index if not exists idx_products_sort on products(sort_order);
create index if not exists idx_products_collection on products(collection_id);
create index if not exists idx_collections_sort on collections(sort_order);
create index if not exists idx_subscribers_created on email_subscribers(created_at desc);

-- 2. 种子数据（已存在的 slug / section_key 会被跳过） -----------

insert or ignore into collections (title, sub_title, image_url, slug, sort_order) values
  ('Neutral Linen',   'SOFT NATURAL LINEN TONES',     'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=70', 'neutral-linen',   1),
  ('Textured Weaves', 'RICH WOVEN TEXTURES',          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=70',    'textured-weaves', 2),
  ('Vintage Hues',    'MUTED VINTAGE COLOR PALETTE',  'https://images.unsplash.com/photo-1505693319-338cfb69814b?auto=format&fit=crop&w=800&q=70',    'vintage-hues',    3);

insert or ignore into products
  (name, price, image_url, description, detail, slug, collection_id, is_featured, sort_order)
values
  ('Olivier Linen Pillow', 98,
   'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=70',
   'Soft washed linen pillow in warm oat tone.', '18"x18", linen cover, down alternative insert included.',
   'olivier-linen-pillow', (select id from collections where slug = 'neutral-linen'), 1, 1),
  ('Riviera Stripe Pillow', 98,
   'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=70',
   'Subtle thin stripe woven textile.', '20"x20", cotton blend, hidden zipper.',
   'riviera-stripe-pillow', (select id from collections where slug = 'textured-weaves'), 1, 2),
  ('Sienne Embroidered Pillow', 118,
   'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=70',
   'Hand embroidered floral motif.', '18"x22", linen base, dry clean recommended.',
   'sienne-embroidered-pillow', (select id from collections where slug = 'vintage-hues'), 1, 3),
  ('Paloma Pillow', 98,
   'https://images.unsplash.com/photo-1505693319-338cfb69814b?auto=format&fit=crop&w=800&q=70',
   'Solid warm clay textured pillow.', '20"x20", heavy woven cotton.',
   'paloma-pillow', (select id from collections where slug = 'neutral-linen'), 1, 4),
  ('Terra Velvet Pillow', 98,
   'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=70',
   'Plush muted terracotta velvet.', '18"x18", polyester velvet, removable cover.',
   'terra-velvet-pillow', (select id from collections where slug = 'vintage-hues'), 1, 5),
  ('Esme Lumbar Pillow', 96,
   'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=800&q=70',
   'Long lumbar woven accent pillow.', '12"x24", mixed fiber weave.',
   'esme-lumbar-pillow', (select id from collections where slug = 'textured-weaves'), 1, 6);

insert or ignore into home_page_content
  (section_key, title, sub_title, description, button_text, button_link, image_url)
values
  ('hero', 'Chen Furniture', 'Textiles for a more beautiful life',
   'Handcrafted artisan pillows inspired by travels around the world. Soft textures, natural tones, made by skilled craftspeople.',
   'Shop Collection', '/shop', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=70'),
  ('craft', 'Crafted by Hand', 'for a kinder home',
   'Our pillows are made in partnership with skilled artisans worldwide. Every piece honors traditional techniques and natural materials.',
   'Our Craft', '/about', 'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=1200&q=70'),
  ('gift', 'A More Meaningful Gift', '',
   'Thoughtful, timeless gifts for homes and hearts you love.',
   'Shop Gifts', '/shop', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=70'),
  ('story', 'Our Story', '',
   'Chen Furniture was born from a love of travel, craft and the belief that home should feel like a refuge.',
   'Read Our Story', '/about', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=70');

-- 3. 创建管理员账号 -------------------------------------------
-- 在项目目录执行（密码在本地哈希，不会上传到任何第三方）：
--   npm run admin:create -- you@example.com
-- 脚本会提示输入密码，并生成对应的 UPSERT 语句写入 D1。
