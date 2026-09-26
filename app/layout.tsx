import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { CartProvider } from './context/CartContext'
import CartSidebar from '@/components/CartSidebar'
import { siteConfig, unsplashImage } from '@/lib/catalog'

// next/font 在构建期把字体内联自托管，省掉第三方请求、避免字体加载阻塞与布局抖动
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' })

const ogImage = unsplashImage('photo-1505693416388-ac5ce068fe85', 1200)

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: ['artisan pillows', 'linen pillow', 'handmade cushion', 'natural textiles', 'Chen Furniture'],
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: '/',
    locale: 'en_US',
    images: [{ url: ogImage, width: 1200, alt: 'Chen Furniture artisan pillows' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [ogImage],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f7f3ed',
  colorScheme: 'light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-warmBg text-earthText font-sans">
        <CartProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-white focus:px-4 focus:py-2"
          >
            Skip to content
          </a>
          <Navbar />
          <div id="main">{children}</div>
          <CartSidebar />
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}

