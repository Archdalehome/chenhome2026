# Casa Plume — 手工抱枕品牌电商站

Next.js 14（App Router）+ Tailwind CSS + Supabase，**纯静态导出**并部署到 **Cloudflare Pages**。
完全响应式（PC / 平板 / 手机）。

---

## 1. 架构与数据流

| 部分 | 数据来源 | 说明 |
| --- | --- | --- |
| 前台页面（首页 / 商店 / 系列 / 商品详情） | `lib/catalog.ts` | 构建期生成静态 HTML，首屏无需请求数据，SEO 与 LCP 最佳 |
| 管理后台 `/admin/*` | Supabase（浏览器直连 + RLS） | 需登录 Supabase Auth，并在 `admin_users` 白名单中 |
| 邮件订阅表单 | Supabase（anon insert 策略） | 提交时才动态加载 supabase-js（不拖慢首页） |
| 购物车 | localStorage | 无需后端，刷新不丢 |

> ⚠️ **重要变更**：项目原来是 `output: 'export'` + `app/api/**` Route Handlers 的组合，
> 这两者在 Next.js 中是互斥的（静态导出不支持 Route Handlers，`next build` 会直接失败）。
> 现已删除全部 API 路由，改为浏览器端直连 Supabase。anon key 本来就会暴露在前端包中，
> 真正的安全边界是 `database.sql` 里的 RLS 策略。

---

## 2. 快速开始（本地）

```bash
# 1) 安装依赖（Node 22，见 .node-version；Cloudflare 构建镜像默认也是 Node 22）
npm install

# 2) 配置环境变量
copy .env.local.example .env.local   # macOS/Linux: cp .env.local.example .env.local
#   然后填入 Supabase 的真实值

# 3) 初始化数据库：把 database.sql 全文粘贴到 Supabase SQL Editor 执行

# 4) 启动开发服务器
npm run dev
```

- 前台：http://localhost:3000
- 后台：http://localhost:3000/admin/login

### 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 开发模式 |
| `npm run build` | 生成静态站点到 `out/` |
| `npm run preview` | 本地预览 `out/`（等价于线上静态环境） |
| `npm run typecheck` | TypeScript 类型检查 |

---

## 3. 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 是 | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 是 | Supabase anon public key |
| `NEXT_PUBLIC_SITE_URL` | 建议 | 站点正式域名，用于 canonical / sitemap / OG，结尾不要带 `/` |

未配置 Supabase 时：前台所有页面仍可正常访问（纯静态内容），
订阅按钮会置灰并提示，后台会显示配置指引而不会白屏。

---

## 4. Supabase 配置清单

1. **执行 `database.sql`**（幂等，可重复执行）：建表 + RLS + Storage 策略 + 演示数据。
2. **Storage**：脚本会自动创建公开读的 `product-images` 桶，并只允许管理员写入。
3. **创建管理员账号**（两步）：
   1. Dashboard → Authentication → Users → Add user（填邮箱 + 密码，建议勾选 Auto Confirm User）；
   2. 执行 SQL 把该邮箱加入白名单：
      ```sql
      insert into public.admin_users (email) values ('you@example.com')
      on conflict (email) do nothing;
      ```
4. 只有「已登录 **且** 邮箱在 `admin_users` 中」的账号才能增删改商品/系列/首页内容与上传图片。

---

## 5. 部署到 Cloudflare Pages

### 方式 A：Git 集成（推荐，推送即自动部署）

1. 把本仓库推到 GitHub。
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → 选择仓库。
3. 构建设置：

   | 项 | 值 |
   | --- | --- |
   | Project name（项目名称） | 建议填 `chenhome2026` —— 它决定默认域名 `chenhome2026.pages.dev`，正好与 `NEXT_PUBLIC_SITE_URL` 的默认值一致 |
   | Production branch（生产分支） | `main` |
   | Framework preset | `Next.js (Static HTML Export)`（官方预设会自动填好 `npx next build` 与 `out`）；下拉里没有就选 `None` 并手填下面两行 |
   | Build command（构建命令） | `npm run build`（与官方预设的 `npx next build` 等价） |
   | Build output directory（输出目录） | `out` |
   | Root directory（根目录） | 留空 |
   | Node version | 不需要设置：Pages v3 构建镜像默认 Node 22.16，与仓库里的 `.node-version`（22）一致。如需锁定可加环境变量 `NODE_VERSION` |

   > 真正必须正确的只有「构建命令 + 输出目录」这两项；Framework preset 只是帮你自动填它们。
   > ⚠️ 不要选普通的 `Next.js` 预设，它会走 `@cloudflare/next-on-pages`（SSR 路线），与本项目的纯静态导出不匹配。
   > ⚠️ 另外注意：**Git 集成的项目之后无法再切换为 Direct Upload**，两种部署方式一开始就要选定。

4. **Environment variables** 中添加第 3 节的三条变量（Production 和 Preview 都建议加）。
5. Save and Deploy。之后每次 `git push` 都会自动重新构建。
6. 绑定自定义域名（Custom domains）后，记得把 `NEXT_PUBLIC_SITE_URL` 改成正式域名并重新部署。

### 方式 B：本地构建 + 直接上传

```bash
npm run build
npx wrangler pages deploy out --project-name=chenhome2026
```

### 后台改完数据的处理

前台是静态页面，后台修改 Supabase 数据后，**需要重新构建**才会反映到前台。
两种做法：
- 在 Cloudflare Pages 里创建 **Deploy Hook**，后台改完后调用一次；
- 或者直接把前台改为客户端实时读取 Supabase（见第 8 节）。

---

## 6. 目录结构

```
chenhome/
├── app/
│   ├── layout.tsx              # 根布局：字体、SEO metadata、购物车 Provider
│   ├── page.tsx                # 首页
│   ├── shop/                   # 全部商品
│   ├── collections/            # 系列列表 + [slug] 系列详情（generateStaticParams）
│   ├── products/[slug]/        # 商品详情：page.tsx（服务端，SEO）+ ProductDetail.tsx（客户端交互）
│   ├── cart/                   # 购物车页
│   ├── about/  journal/        # 关于 / 日志
│   ├── admin/
│   │   ├── login/              # 后台登录
│   │   └── (dash)/             # 受保护的布局（登录守卫 + 后台导航）
│   │       ├── dashboard/ products/ collections/ home-editor/ subscribers/
│   ├── context/CartContext.tsx # 购物车状态（localStorage）
│   ├── robots.ts sitemap.ts    # 构建期生成 robots.txt / sitemap.xml
│   └── icon.svg                # favicon
├── components/                 # Navbar / Footer / CartSidebar / 各首页版块
├── lib/
│   ├── catalog.ts              # 前台内容单一数据源（商品、系列、价格格式化）
│   ├── supabase.ts             # 懒加载 Supabase 客户端
│   └── data.ts                 # 后台 CRUD / 上传 / 登录
├── public/_headers             # Cloudflare Pages 缓存与安全响应头
├── database.sql                # 数据库脚本（幂等）
├── next.config.js              # output: 'export'
└── .node-version               # 构建 Node 版本（22）
```

---

## 7. 本次优化清单（相对初始版本）

**修复部署阻塞问题**

1. 删除 `app/api/**`（静态导出不支持 Route Handlers，会导致 `next build` 失败）。
2. 新增 `tsconfig.json` + `typescript`/`@types/*` 依赖（原来有 `.tsx` 却没装 TS，构建必失败）。
3. 为 `products/[slug]`、`collections/[slug]` 增加 `generateStaticParams` + `dynamicParams = false`。
4. 把商品详情页拆成「服务端 page.tsx + 客户端 ProductDetail.tsx」（客户端组件无法导出 `generateStaticParams`）。
5. 移除无效依赖 `@supabase/auth-helpers-nextjs`；`next` 改为 `^14.2.0` 以获取安全补丁。
6. 新增 `.gitignore`（原来会把 `node_modules`、`.next`、`.env.local` 一起提交）。

**数据库**

7. 修复 RLS 缺陷：原策略 `auth.jwt() ->> 'email' in (select email from admin_users)` 因 `admin_users`
   自身开启 RLS 且无策略，子查询恒为空 → 管理员所有写操作被拒绝。改用 `SECURITY DEFINER` 的 `public.is_admin()`。
8. 补齐 Storage 的 `product-images` 桶与读/写/改/删策略；`database.sql` 改为幂等可重复执行。
9. `products.collection_id` 外键改为 `on delete set null`，删除系列不再被商品阻断。

**安全**

10. 后台原来完全无鉴权（任何人可访问 `/admin/*`），现增加登录守卫 + 后台导航 + 退出登录。
11. Supabase 客户端改为懒加载，未配置环境变量时不会白屏。

**性能**

12. 字体改用 `next/font` 自托管（原来 CSS `@import` 写在 `@tailwind` 之后，且与 `next/font` 重复加载）。
13. Unsplash 图片统一走 `auto=format`（按浏览器能力返回 webp/avif）+ 明确 `sizes`，首屏图补 `priority`。
14. 订阅表单动态 `import`，supabase-js（约 52 kB gz）不再进入首页首屏包。
15. 新增 `public/_headers`：静态资源强缓存、HTML 不缓存、基础安全响应头。

**SEO / 可访问性 / 体验**

16. 补全 metadata（title 模板、description、Open Graph、Twitter、canonical、metadataBase）。
17. 新增 `robots.ts`、`sitemap.ts`（含全部商品/系列页）、`icon.svg` favicon（原来 404）。
18. 首页 Hero 加渐变遮罩（原来深色文字压在照片上几乎不可读）。
19. 全站补 `aria-label` / `aria-current` / `aria-live`、跳转到正文链接、`:focus-visible` 焦点样式。
20. 移动端补齐购物车入口（原来手机无法打开购物车）；导航当前页高亮；路由切换自动收起菜单。
21. 消除「点击无反应」的死按钮：首页各按钮、卡片、Footer 链接、Read More 全部改为可跳转链接。
22. 商品数据原本在 4 个文件里重复硬编码，现统一到 `lib/catalog.ts`，`generateStaticParams` 由它驱动。

---

## 8. 已知限制 / 后续可做

- **结算未接支付**：购物车页与侧边栏按钮目前只做跳转，未接订单后端（静态站点可接 Stripe Payment Links、Snipcart，或 Cloudflare Worker + Stripe API）。
- **搜索 / 账户入口已移除**：原页面上的 🔍 与 👤 图标没有任何功能，属死按钮，故移除；需要搜索可接 Pagefind / Algolia。
- **Journal 文章详情页未实现**：列表页的 Read More 暂时指向 `/collections`。
- **后台修改与前台数据的同步**：前台是构建期静态内容。若希望后台改完立刻生效，可把 `lib/catalog.ts` 的取值改为客户端请求 `lib/data.ts`（需接受首屏无内容）或改用 SSR/CMS。
- 商品详情页的 Related Products 尚未实现。

---

## 9. 常见问题

| 现象 | 原因 / 处理 |
| --- | --- |
| 构建日志报 Node 版本相关错误 | 仓库自带 `.node-version`（22），与 Pages v3 镜像默认一致，一般无需处理；要强制指定就加环境变量 `NODE_VERSION=22` |
| 首页订阅按钮是灰色 | 没有配置环境变量，或配置后没有重新部署 |
| 后台登录成功但保存商品失败 | `database.sql` 未执行（尤其 `is_admin()` 与 RLS 策略），或邮箱未加入 `admin_users` |
| 上传图片报 `new row violates row-level security policy` | Storage 策略未执行，重跑 `database.sql` 第 4 节 |
| 新增商品在前台看不到 | 前台为静态导出，需要重新构建 / 触发 Deploy Hook |
| 商品、系列新页面 404 | 该 slug 的静态页在构建时不存在，重新构建即可 |
| 部署日志报 `Output directory "out" not found` | 说明 `npm run build` 没成功，往上翻日志找第一条 `Error`；本地执行 `npm run build` 可复现 |
| 部署成功但访问路径 404 | 检查输出目录是否填 `out`。本项目生成的是无扩展名 HTML（`/shop` 对应 `shop.html`），Cloudflare Pages 会按官方规则自动匹配 `/shop` ↗ `shop.html`，并把 `/shop.html` 重定向到 `/shop` |

### 部署前自检（本仓库已验证）

- [x] `npm run build` 成功：`Compiled successfully` + `Generating static pages (27/27)`，产物 22 个 HTML（含 `404.html`）
- [x] `npm run typecheck` 通过（exit 0）
- [x] 不配置任何环境变量也能构建成功（前台纯静态，后台/订阅会提示未配置）
- [x] 产物含 `robots.txt`、`sitemap.xml`、`icon.svg`、`_headers`、`404.html`
- [x] `_headers` 只使用 Cloudflare 官方文档认可的路径格式（`/*`、`/_next/static/*`），避免规则解析失败导致部署报错
- [x] 仓库不含 `node_modules` / `.next` / `out` / `.env.local`（`.gitignore` 已生效）


