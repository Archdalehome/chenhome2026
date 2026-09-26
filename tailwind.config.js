/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        warmBg: '#f7f3ed',
        earthText: '#342b24',
        terracotta: '#9c5b38',
        oliveDark: '#3c4838',
      },
      fontFamily: {
        // 字体由 app/layout.tsx 通过 next/font 自托管加载，附带完整降级栈
        serif: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
        sans: [
          'var(--font-inter)',
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}

