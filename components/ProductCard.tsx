import Image from 'next/image'
import Link from 'next/link'

type Props = {
  name: string
  price: string
  img: string
  /** 传入商品详情页地址后卡片整体可点击 */
  href?: string
}

export default function ProductCard({ name, price, img, href }: Props) {
  const content = (
    <div className="h-full">
      <div className="relative mb-3 aspect-square overflow-hidden bg-stone-100">
        <Image
          src={img}
          fill
          alt={name}
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <h3 className="text-sm">{name}</h3>
      <p className="text-sm text-stone-600">{price}</p>
    </div>
  )

  if (!href) return content

  return (
    <Link href={href} className="group block">
      {content}
    </Link>
  )
}
