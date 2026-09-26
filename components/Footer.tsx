import Link from 'next/link'

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { href: '/collections', label: 'Collections' },
      { href: '/shop', label: 'Pillows' },
      { href: '/shop', label: 'Gifts' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/about', label: 'Contact' },
      { href: '/journal', label: 'Journal' },
    ],
  },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-oliveDark py-12 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h2 className="mb-4 font-serif text-xl">Chen Furniture</h2>
            <p className="text-sm opacity-80">TEXTILES FOR A MORE BEAUTIFUL LIFE</p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="mb-3">{column.title}</h3>
              <ul className="space-y-2 text-sm opacity-80">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:opacity-100 hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="mb-3">Follow</h3>
            <div className="flex gap-4 text-sm opacity-80">
              <a href="https://instagram.com" rel="noopener noreferrer" target="_blank" className="hover:underline">
                Instagram
              </a>
              <a href="https://facebook.com" rel="noopener noreferrer" target="_blank" className="hover:underline">
                Facebook
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/20 pt-6 text-xs opacity-60">
          © {year} Chen Furniture. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
