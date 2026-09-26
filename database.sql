-- ============================================================
-- Casa Plume / Chenhome 数据库初始化脚本
-- 使用方式：Supabase Dashboard -> SQL Editor -> 粘贴执行
-- 本脚本是幂等的，可以重复执行（不会清空已有数据）
-- ============================================================

-- ------------------------------------------------------------
-- 1. 表结构
-- ------------------------------------------------------------

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  sub_title text,
  image_url text,
  slug text unique not null,
  sort_order int default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null,
  description text,
  detail text,
  image_url text not null,
  collection_id uuid references public.collections(id) on delete set null,
  is_featured boolean default false,
  slug text unique not null,
  sort_order int default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.home_page_content (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  title text,
  sub_title text,
  description text,
  button_text text,
  button_link text,
  image_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

-- 删除系列时把商品置为「未分类」而不是阻断删除
alter table public.products drop constraint if exists products_collection_id_fkey;
alter table public.products
  add constraint products_collection_id_fkey
  foreign key (collection_id) references public.collections(id) on delete set null;

-- ------------------------------------------------------------
-- 2. 管理员判定函数
--    关键修复：旧策略用 `auth.jwt() ->> 'email' in (select email from admin_users)`，
--    而 admin_users 开启了 RLS 且没有策略，子查询永远返回 0 行，
--    导致管理员所有写操作都被拒绝。这里用 SECURITY DEFINER 函数绕过该递归问题。
-- ------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ------------------------------------------------------------
-- 3. RLS 与权限策略
-- ------------------------------------------------------------

alter table public.admin_users       enable row level security;
alter table public.collections       enable row level security;
alter table public.products          enable row level security;
alter table public.home_page_content enable row level security;
alter table public.email_subscribers enable row level security;

-- 前台公开只读
drop policy if exists public_read_products on public.products;
create policy public_read_products on public.products
  for select using (true);

drop policy if exists public_read_collections on public.collections;
create policy public_read_collections on public.collections
  for select using (true);

drop policy if exists public_read_home on public.home_page_content;
create policy public_read_home on public.home_page_content
  for select using (true);

-- 管理员可写
drop policy if exists admin_write_products on public.products;
create policy admin_write_products on public.products
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_write_collections on public.collections;
create policy admin_write_collections on public.collections
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_write_home on public.home_page_content;
create policy admin_write_home on public.home_page_content
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 邮件订阅：任何人可提交，仅管理员可查看
drop policy if exists public_insert_subscribers on public.email_subscribers;
create policy public_insert_subscribers on public.email_subscribers
  for insert to anon, authenticated with check (true);

drop policy if exists admin_read_subscribers on public.email_subscribers;
create policy admin_read_subscribers on public.email_subscribers
  for select to authenticated using (public.is_admin());

-- admin_users 本身不开放任何策略：只能通过 is_admin() / service_role 访问

-- ------------------------------------------------------------
-- 4. Storage 存储桶（后台商品图片上传）
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- ------------------------------------------------------------
-- 5. 初始化演示数据（已存在的 slug / section_key 会被跳过）
-- ------------------------------------------------------------

insert into public.home_page_content
  (section_key, title, sub_title, description, button_text, button_link, image_url)
values
  ('hero', 'Casa Plume', 'Textiles for a more beautiful life',
   'Handcrafted artisan pillows inspired by travels around the world. Soft textures, natural tones, made by skilled craftspeople.',
   'Shop Collection', '/shop', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200'),
  ('craft', 'Crafted by Hand', 'for a kinder home',
   'Our pillows are made in partnership with skilled artisans worldwide. Every piece honors traditional techniques and natural materials.',
   'Our Craft', '/about', 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200'),
  ('gift', 'A More Meaningful Gift', '',
   'Thoughtful, timeless gifts for homes and hearts you love.',
   'Shop Gifts', '/shop', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1200'),
  ('story', 'Our Story', '',
   'Casa Plume was born from a love of travel, craft and the belief that home should feel like a refuge.',
   'Read Our Story', '/about', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200')
on conflict (section_key) do nothing;

insert into public.collections (title, sub_title, image_url, slug, sort_order)
values
  ('Neutral Linen',   'Soft natural linen tones',      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800', 'neutral-linen',   1),
  ('Textured Weaves', 'Rich woven textures',           'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',    'textured-weaves', 2),
  ('Vintage Hues',    'Muted vintage color palette',   'https://images.unsplash.com/photo-1505693319-338cfb69814b?w=800',    'vintage-hues',    3)
on conflict (slug) do nothing;

insert into public.products
  (name, price, image_url, description, detail, slug, collection_id, is_featured, sort_order)
values
  ('Olivier Linen Pillow', 98, 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600',
   'Soft washed linen pillow in warm oat tone.', '18"x18", linen cover, down alternative insert included.',
   'olivier-linen-pillow', (select id from public.collections where slug = 'neutral-linen'), true, 1),
  ('Riviera Stripe Pillow', 98, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600',
   'Subtle thin stripe woven textile.', '20"x20", cotton blend, hidden zipper.',
   'riviera-stripe-pillow', (select id from public.collections where slug = 'textured-weaves'), true, 2),
  ('Sienne Embroidered Pillow', 118, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600',
   'Hand embroidered floral motif.', '18"x22", linen base, dry clean recommended.',
   'sienne-embroidered-pillow', (select id from public.collections where slug = 'vintage-hues'), true, 3),
  ('Paloma Pillow', 98, 'https://images.unsplash.com/photo-1505693319-338cfb69814b?w=600',
   'Solid warm clay textured pillow.', '20"x20", heavy woven cotton.',
   'paloma-pillow', (select id from public.collections where slug = 'neutral-linen'), true, 4),
  ('Terra Velvet Pillow', 98, 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600',
   'Plush muted terracotta velvet.', '18"x18", polyester velvet, removable cover.',
   'terra-velvet-pillow', (select id from public.collections where slug = 'vintage-hues'), true, 5),
  ('Esme Lumbar Pillow', 96, 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600',
   'Long lumbar woven accent pillow.', '12"x24", mixed fiber weave.',
   'esme-lumbar-pillow', (select id from public.collections where slug = 'textured-weaves'), true, 6)
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- 6. 创建管理员（两步）
--    a) Supabase Dashboard -> Authentication -> Users -> Add user
--       填写邮箱 + 密码（建议勾选 Auto Confirm User）
--    b) 把该邮箱加入白名单（下面的语句改成你的邮箱后执行）：
-- ------------------------------------------------------------

-- insert into public.admin_users (email)
-- values ('admin@example.com')
-- on conflict (email) do nothing;
