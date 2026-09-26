#!/usr/bin/env node
/** 生成本地开发用的根目录 wrangler.jsonc（该文件已被 .gitignore 忽略，不会提交） */
import { copyFileSync, existsSync } from 'node:fs'

const source = 'dev/wrangler.dev.jsonc'
const target = 'wrangler.jsonc'

if (existsSync(target)) {
  console.log(`✓ 根目录已存在 ${target}，跳过生成`)
} else {
  copyFileSync(source, target)
  console.log(`✓ 已生成 ${target}（来自 ${source}，不会提交到 Git）`)
}

console.log(`
接下来按顺序执行：

  1) npm run build
       生成静态产物 out/

  2) npm run db:init:local
       在本地 D1 建表并灌入种子数据

  3) npm run admin:create:local -- you@example.com
       创建本地管理员账号（密码本地哈希，可用 ADMIN_PASSWORD 环境变量免交互）

  4) npm run preview:cf
       启动本地 Pages 模拟环境，默认 http://127.0.0.1:8788

  5) npm run smoke:local
       另开一个终端跑接口冒烟测试
`)
