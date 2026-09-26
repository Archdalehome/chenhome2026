import Image from 'next/image'

type Props = {
  title: string
  sub: string
  img: string
}

export default function CollectionCard({ title, sub, img }: Props) {
  return (
    <div className="group">
      <div className="relative mb-3 aspect-[4/3] overflow-hidden bg-stone-100">
        <Image
          src={img}
          fill
          alt={title}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <h3 className="font-serif text-lg">{title}</h3>
      <p className="text-xs tracking-wide">{sub}</p>
    </div>
  )
}
