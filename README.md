# Casa Plume — 手工抱枕品牌电商站

Next.js 14（App Router）+ Tailwind CSS + **Cloudflare 运行时**（Pages Functions + D1 + R2），
**纯静态导出**后部署到 **Cloudflare Pages**，全站响应式（PC / 平板 / 手机）。

> 数据层已从 Supabase 完整迁移到 **Cloudflare D1（SQLite）+ R2（图片存储）**：
> 一个厂商、一个账单，后台鉴权由项目自带的 Pages Functions 实现
> （PBKDF2 密码哈希 + HMAC 签名的 HttpOnly 会话 Cookie）。

---

## 1. 架构与数据流

| 部分 | 承载方 | 说明 |
| --- | --- | --- |
| 前台页面（首页 / 商店 / 系列 / 商品详情） | 构建期静态导出到 `out/` | 首屏不请求接口，SEO 与 LCP 最好 |
| 后台 `/admin/*` | 静态页面 + `/api/*` 接口 | 数据经 Pages Functions 读写 D1；未登录会被守卫跳转到登录页 |
| 商品图片 | R2 + `/api/images/<key>` | 图片与站点同源，**不需要**给 R2 配自定义域名或公开 r2.dev 地址 |
| 邮件订阅 | `/api/subscribe` → D1 | 公开接口，重复邮箱会返回友好提示 |
| 购物车 | 浏览器 localStorage | 无需后端，刷新不丢 |

### 接口清单（全部同源 `/api/*`，实现在 `functions/`）

| 方法 | 路径 | 权限 |
| --- | --- | --- |
| GET | `/api/products`、`/api/collections`、`/api/home-content` | 公开 |
| POST / PUT / DELETE | `/api/products`、`/api/collections`、`/api/home-content` | 管理员 |
| POST | `/api/auth/login`、`/api/auth/logout` | 公开 / 已登录 |
| GET | `/api/auth/session` | 公开 |
| POST | `/api/subscribe` | 公开 |
| GET | `/api/subscribers` | 管理员 |
| POST | `/api/upload` | 管理员 |
| GET / HEAD | `/api/images/<key>` | 公开 |

### 安全设计要点

- 密码用 **PBKDF2-SHA256（150,000 次迭代 + 每账号随机盐）** 哈希后存 D1，明文密码不落盘、不上传
- 会话是 **HMAC-SHA256 签名的 HttpOnly + Secure + SameSite=Lax** Cookie（默认 7 天），服务端无状态
- 登录失败按 IP 限流：15 分钟内 8 次即锁定；且账号不存在时也走等长的哈希计算，**避免通过响应时间枚举管理员邮箱**
- 每个写接口都会校验会话签名，并复核该邮箱仍在 `admin_users` 白名单中（移除账号立即失效）
- 上传只接受 PNG / JPEG / WebP / AVIF / GIF，扩展名由服务端决定（不采用客户端文件名，防路径穿越），不接受 SVG（可能携带脚本导致同源 XSS）
- 图片响应带 `nosniff` 与 `Content-Security-Policy: default-src 'none'; sandbox`

---

## 2. 目录结构

```
chenhome/
├── app/                      # Next.js 页面
│   ├── layout.tsx            # 根布局：字体、SEO metadata、购物车 Provider
│   ├── page.tsx              # 首页
│   ├── shop/ collections/ products/[slug]/   # 静态生成（generateStaticParams）
│   ├── cart/ about/ journal/
│   ├── admin/
│   │   ├── login/            # 后台登录页
│   │   └── (dash)/           # 受保护布局：登录守卫 + 后台导航
│   ├── context/CartContext.tsx
│   ├── robots.ts sitemap.ts icon.svg
├── components/               # Navbar / Footer / CartSidebar / 首页各版块
├── functions/                # ★ Cloudflare Pages Functions（后端）
│   ├── _lib/                 # env 类型、JSON 工具、鉴权（哈希/会话/限流）
│   ├── api/products|collections|home-content|subscribe|subscribers|upload/
│   ├── api/auth/login|logout|session.ts
│   ├── api/images/[[key]].ts  # 从 R2 读图
│   └── tsconfig.json          # Functions 独立类型配置（根 tsconfig 已排除本目录）
├── lib/
│   ├── catalog.ts            # 前台静态内容单一数据源
│   └── data.ts               # 前端调用 /api/* 的封装
├── scripts/
│   ├── create-admin.mjs      # 创建/重置管理员（本地哈希密码后写入 D1）
│   └── setup-local.mjs       # 生成本地开发用的根目录 wrangler.jsonc
├── dev/
│   ├── wrangler.dev.jsonc    # 本地开发配置模板（复制到根目录使用，不提交）
│   └── smoke-test.ps1        # 接口冒烟测试（本地/线上通用）
├── schema.sql                # ★ D1 建表 + 索引 + 种子数据（幂等）
├── public/_headers           # Pages 缓存与安全响应头
├── public/_routes.json       # 只让 /api/* 走 Functions，静态资源不消耗函数调用
└── next.config.js            # output: 'export'
```

---

## 3. 本地开发

```bash
npm install
npm run dev:setup        # 生成根目录 wrangler.jsonc（本地开发专用，已被 .gitignore 忽略）
npm run build            # 静态导出到 out/
npm run db:init:local    # 在本地 D1 建表 + 灌入种子数据
npm run admin:create:local -- you@example.com   # 创建本地管理员（会提示输入密码）
npm run preview:cf       # 启动本地 Pages 环境 http://127.0.0.1:8788
```

再开一个终端跑冒烟测试：

```bash
npm run smoke:local
# 带管理员鉴权 + 写入 + R2 上传往返测试
powershell -File dev/smoke-test.ps1 -Email you@example.com -Password 'your-password' -Write -Upload
```

- 本地密钥放在 `.dev.vars`（从 `.dev.vars.example` 复制），`wrangler pages dev` 会自动读取
- 只想调前端样式可以用 `npm run dev`（Next dev，但纯 Next 下 `/api/*` 不可用）

### npm 脚本一览

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | Next.js 开发服务器（不含 `/api/*`） |
| `npm run build` | 静态导出到 `out/` |
| `npm run preview:cf` | `wrangler pages dev`：本地完整模拟 Pages + Functions + D1 + R2 |
| `npm run preview` | 只预览静态产物（不含接口） |
| `npm run dev:setup` | 生成根目录 `wrangler.jsonc`（本地开发必需） |
| `npm run db:init:local` / `db:init` | 把 `schema.sql` 应用到本地 / 线上 D1 |
| `npm run admin:create` / `admin:create:local` | 创建或重置管理员账号（线上 / 本地） |
| `npm run smoke:local` | 对本地环境跑接口冒烟测试 |
| `npm run typecheck` | 类型检查（前端 + `functions/`） |

> ⚠️ 不要写成 `npm run admin:create -- you@example.com --local`：npm 会吞掉 `--local`。
> 本地请用 `npm run admin:create:local -- you@example.com`。
> 想免交互可先设置环境变量 `ADMIN_PASSWORD`。

---

## 4. 环境变量与密钥

| 名称 | 类型 | 生效阶段 | 说明 |
| --- | --- | --- | --- |
| `SESSION_SECRET` | **Secret** | Functions 运行时 | 会话签名密钥，**必须设置**，否则后台不可用。建议 32 位以上随机串 |
| `NEXT_PUBLIC_SITE_URL` | 明文 | 构建期 | 站点正式域名，用于 canonical / sitemap / OG，结尾不要带 `/` |

这两项都**不放进 `.env.local`**：`SESSION_SECRET` 是服务端密钥，线上在 Pages 控制台配置、
本地放 `.dev.vars`（已被 gitignore）。

生成随机密钥：

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```


---

## 5. 在 Cloudflare 创建资源（一次性）

先登录 wrangler（会打开浏览器授权）：

```bash
npx wrangler login
```

### 5.1 创建 D1 数据库

```bash
npx wrangler d1 create chenhome-db
```

也可以在 Dashboard → **Workers & Pages** → **D1** → **Create database** 创建，
名字保持 `chenhome-db`（或同步修改 `package.json` 里的脚本与 `dev/wrangler.dev.jsonc`）。

### 5.2 建表 + 种子数据

```bash
npm run db:init
```

等价于 `npx wrangler d1 execute chenhome-db --remote --file=./schema.sql`，幂等、可重复执行。

### 5.3 创建 R2 存储桶

```bash
npx wrangler r2 bucket create chenhome-images
```

> R2 需要在控制台开通一次（免费额度足够本站，但要求先绑定支付方式）。
> 不开 R2 也不影响部署：后台「商品图片」可以直接粘贴外部图片地址（例如 Unsplash 链接），
> 只有**上传本地文件**才需要 R2。

### 5.4 创建管理员账号

```bash
npm run admin:create -- you@example.com
```

密码在本地用 PBKDF2 哈希后写入 D1，明文不会离开你的机器。

---

## 6. 部署到 Cloudflare Pages

### 6.1 连接 Git 仓库

1. Dashboard 左侧 **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. 授权 GitHub（只勾选 `Archdalehome/chenhome2026` 即可）→ 选中仓库 → **Begin setup**

### 6.2 构建设置

| 字段 | 值 |
| --- | --- |
| Project name | `chenhome2026`（决定默认域名 `chenhome2026.pages.dev`，与 `NEXT_PUBLIC_SITE_URL` 默认值一致） |
| Production branch | `main` |
| Framework preset | `Next.js (Static HTML Export)`（官方预设会自动填 `npx next build` + `out`）；没有就选 `None` 手填下面两行 |
| Build command | `npm run build` |
| Build output directory | `out` |
| Root directory | 留空 |
| Node version | 不需要设置：Pages v3 构建镜像默认 Node 22.16，与仓库 `.node-version` 一致 |

> ⚠️ 不要选普通的 `Next.js` 预设，它走 `@cloudflare/next-on-pages`（SSR 路线），与本项目不匹配。
> ⚠️ Git 集成的项目之后无法再切换为 Direct Upload，两种方式一开始就要选定。

### 6.3 配置环境变量与密钥

Settings → **Variables and Secrets** → 添加：

| 名称 | 类型 | 值 |
| --- | --- | --- |
| `SESSION_SECRET` | **Secret** | 32 位以上随机串（用第 4 节的命令生成） |
| `NEXT_PUBLIC_SITE_URL` | Plaintext | `https://chenhome2026.pages.dev`（换了域名要同步改） |

Production 与 Preview 环境都建议各配一份。

### 6.4 绑定 D1 与 R2（让 `/api/*` 能读写数据）

Settings → **Functions** → 分别添加：

| 绑定类型 | 变量名（必须完全一致） | 资源 |
| --- | --- | --- |
| D1 database | `DB` | `chenhome-db` |
| R2 bucket | `BUCKET` | `chenhome-images` |

> 变量名必须正好是 `DB` 与 `BUCKET`，代码里就是按这两个名字取的。
> 绑定保存后要**重新部署一次**才生效（Deployments → 最新部署 → Retry deployment，或 push 一次提交）。

### 6.5 触发部署

点 **Save and Deploy**；之后每次 `git push` 到 `main` 都会自动构建并上线。
构建日志应看到：`Installing dependencies` → `Compiled successfully` →
`Generating static pages (27/27)` → `Uploading... Success`。

### 6.6 部署后验收

```bash
npm run smoke:local
# 换成线上地址 + 管理员账号，做完整验收（含写入与 R2 上传）
powershell -File dev/smoke-test.ps1 -BaseUrl https://chenhome2026.pages.dev -Email you@example.com -Password 'your-password' -Write -Upload
```

预期全部 `[OK]`：静态页面 200、`/api/products` 返回 6 条、未登录读订阅者被拒（401）、
管理员登录成功、R2 上传后 `GET /api/images/...` 返回 200 且 `Content-Type: image/png`。

也可以直接用浏览器验证：

- `https://chenhome2026.pages.dev/api/products` → 返回 JSON 数组（说明 D1 绑定正确）
- `https://chenhome2026.pages.dev/admin/login` → 能登录并进入后台


---

## 7. 自定义域名、日常发布与回滚

| 场景 | 操作 |
| --- | --- |
| 绑定自定义域名 | 项目 → **Custom domains** → **Set up a domain** → 填域名 → Continue。apex 域名需先把 NS 指向 Cloudflare；外部 DNS 的子域名则加 CNAME 指向 `chenhome2026.pages.dev` |
| 换域名后要做什么 | 把 `NEXT_PUBLIC_SITE_URL` 改成新域名 → 重新部署（否则 canonical / sitemap 仍指向 pages.dev） |
| 改代码上线 | `git push` 到 `main` → 自动构建上线 |
| 开分支试功能 | push 任意分支 → 生成独立的 Preview 预览部署 |
| 后台改了数据，前台要更新 | 前台是构建期静态内容，需触发重建：项目 → **Settings → Builds → Add deploy hook**（填名称 + 分支 `main`）→ `curl -X POST <hook-url>` |
| 回滚 | 项目 → **Deployments** → 选中上一次成功部署 → Rollback |
| 改环境变量 | Settings → Variables and Secrets（改完必须重新部署才生效） |

> 🔐 Deploy Hook 的 URL 不需要鉴权就能触发构建，等同于密码，请勿外泄；怀疑泄露就删掉重建。

---

## 8. 常见问题

| 现象 | 原因 / 处理 |
| --- | --- |
| `/api/*` 报 `DB is not defined` 或 `Cannot read properties of undefined` | Pages 里没绑定 D1，或绑定名不是 `DB`（见 6.4）；绑定后需要重新部署 |
| `/api/products` 返回 `no such table: products` | 线上 D1 没执行 `schema.sql`，跑 `npm run db:init` |
| 后台登录提示"服务端未配置 SESSION_SECRET" | 没在 Pages 配置 Secret，或配了没重新部署 |
| 登录报"数据库查询失败" | D1 未绑定或未建表 |
| 上传图片失败，提示 R2 未启用 | 没创建/绑定 R2；也可以改用"粘贴图片 URL"的方式 |
| 上传提示"只支持 PNG / JPEG / WebP / AVIF / GIF" | 不支持 SVG（安全考虑）及其它格式 |
| 构建日志报 `Output directory "out" not found` | 构建失败，往上翻第一条 `Error`；本地 `npm run build` 可复现 |
| 部署成功但访问路径 404 | 检查输出目录是否为 `out`。本项目生成无扩展名 HTML（`/shop` → `shop.html`），Pages 会按官方规则自动匹配，并把 `/shop.html` 308 重定向到 `/shop` |
| 图片 404 | 确认 D1 里 `image_url` 是 `/api/images/...` 前缀，且 R2 中该对象存在 |
| 本地 `preview:cf` / `admin:create:local` 报找不到 DB 绑定 | 没执行 `npm run dev:setup`（需要根目录 `wrangler.jsonc`） |
| 冒烟脚本报中文乱码或语法错误 | `dev/smoke-test.ps1` 必须保持 ASCII；若要写中文，请另存为 UTF-8 **with BOM** |
| 自定义域名 522 | 顺序错了：必须先 Set up a domain，再去 DNS 加 CNAME |

---

## 9. 已知限制 / 后续可做

- **结算未接支付**：购物车按钮只做跳转，未接订单后端（可接 Stripe Payment Links、Snipcart，或再加一个 Functions 接口）
- **前台内容与后台数据不同步**：前台是构建期静态内容（`lib/catalog.ts`），后台改完需重新部署。想实时可把商品页改成客户端请求 `/api/products`
- **Journal 文章详情页未实现**：列表页的 Read More 暂时指向 `/collections`
- **管理员只能通过脚本创建**：没有"忘记密码"流程，忘记密码就重跑 `npm run admin:create`
- **没有多角色与审计日志**：当前只区分"是 / 不是管理员"
- **D1 单库单线程、单库上限 10 GB**：本站数据量远低于上限；若以后有大量并发写入需留意
- 商品详情页的 Related Products 尚未实现


---

## 10. 本次迁移与优化记录

**架构迁移（Supabase → Cloudflare）**

1. 新增 `functions/`（Pages Functions）实现全部后端接口，取代原 `app/api/**`（静态导出不支持 Route Handlers）
2. 新增 `schema.sql`（D1 / SQLite，`strict` 表 + 索引 + 种子数据），替换原 `database.sql`
3. 鉴权改为自建：PBKDF2-SHA256 密码哈希 + HMAC 签名 HttpOnly 会话 Cookie + IP 登录限流 + 白名单复核
4. 图片改为 R2 存储、经同源 `/api/images/<key>` 读取（支持 ETag/304 与长缓存）
5. 前端 `lib/data.ts` 改为调用 `/api/*`，移除 `@supabase/supabase-js` 依赖与 `lib/supabase.ts`
6. 新增 `public/_routes.json`：只有 `/api/*` 走 Functions，静态资源不消耗函数调用
7. 新增 `dev/`（本地 wrangler 配置模板 + 冒烟测试脚本）与 `scripts/`（管理员创建、本地环境初始化）

**部署相关**

8. 保持 `output: 'export'` 纯静态导出 + `out/` 输出目录；`.node-version` 对齐 Pages v3 构建镜像（Node 22）
9. `public/_headers` 只使用 Cloudflare 官方认可的路径格式，避免规则解析失败导致部署报错
10. 新增 `tsconfig.json`、`functions/tsconfig.json`（根配置排除 `functions/`）、`.gitignore`、`.gitattributes`、`.node-version`
11. 为 `products/[slug]`、`collections/[slug]` 补 `generateStaticParams`；商品详情页拆分为服务端 + 客户端组件

**安全**

12. 后台增加登录守卫（原实现无任何鉴权）；所有写接口都校验会话并在 D1 复核白名单
13. 上传白名单化：扩展名由服务端决定、拒绝 SVG、限制 5 MB；图片响应带 `nosniff` 与 CSP
14. 登录失败限流 + 等长哈希耗时（防枚举账号）；错误信息不区分"邮箱不存在"与"密码错误"

**性能 / SEO / 体验**

15. `next/font` 自托管字体；图片 `auto=format` + `sizes` + 首屏 `priority`
16. 订阅表单不再加载第三方 SDK，直接调用同源接口
17. 补全 metadata / OG / canonical / `robots.ts` / `sitemap.ts` / favicon
18. 全站 a11y（aria、跳转正文、焦点样式）、移动端购物车入口、消除"点击无反应"的死按钮
19. 商品数据统一到 `lib/catalog.ts`（原来在 4 个文件里重复硬编码）

---

## 11. 部署前自检（本仓库已实测）

- [x] `npm run build`：`Compiled successfully` + `Generating static pages (27/27)`
- [x] `npm run typecheck`：前端与 `functions/` 均 0 错误
- [x] `npm run preview:cf` + `dev/smoke-test.ps1 -Write -Upload` **全部通过**：
      - 静态：首页内容正确、`/shop` `/collections` `/about` `/cart` `/sitemap.xml` `/robots.txt` 均 200、未知路径返回自定义 404
      - D1：`/api/products` 6 条、`/api/collections` 3 个、`/api/home-content` 4 个版块
      - 鉴权：未登录读 `/api/subscribers` → 401；管理员登录成功；错误密码 → 401
      - 写入：`/api/subscribe` 成功；R2 上传后 `GET /api/images/...` → 200 且 `Content-Type: image/png`
- [x] 产物含 `404.html`、`robots.txt`、`sitemap.xml`、`icon.svg`、`_headers`、`_routes.json`
- [x] 仓库不含 `node_modules` / `.next` / `out` / `.env.local` / `.dev.vars` / `wrangler.jsonc`

