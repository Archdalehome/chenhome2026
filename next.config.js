/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出：构建后生成纯静态文件到 out/，可直接部署 Cloudflare Pages
  output: 'export',
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // 静态导出没有 Next.js 图片优化服务，必须关闭
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

module.exports = nextConfig
