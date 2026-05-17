import Image from 'next/image'
import { getHeroPortrait } from '@/lib/hero-assets'
import type { Hero } from '@/types/overfast'

export function HeroBanner({
  heroKey,
  hero,
}: {
  heroKey: string
  hero: Hero | null
}) {
  const portrait = getHeroPortrait(heroKey)
  const displayName = hero?.name ?? heroKey.replace(/-/g, ' ')

  return (
    <div className="relative w-full h-[70vh] min-h-130 overflow-hidden">
      {portrait && (
        <Image
          src={portrait}
          alt={displayName}
          fill
          priority
          sizes="100vw"
          quality={100}
          className="object-cover object-[70%_15%] md:object-[center_15%]"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-surface-canvas via-surface-canvas/70 to-transparent" />

      <div className="relative h-full flex flex-col justify-end px-4 md:px-16 pb-10 md:pb-16 text-white max-w-400 mx-auto">
        <div className="text-[12px] md:text-[14px] uppercase tracking-[0.25em] font-bold opacity-90 mb-4">
          {hero?.role ?? '—'}
          {hero?.subrole && ` · ${hero.subrole}`}
        </div>
        <h1 className="text-[52px] md:text-[180px] leading-[0.85] font-black uppercase tracking-tighter">
          {displayName}
        </h1>
        {hero?.description && (
          <p className="text-[14px] md:text-[16px] mt-6 opacity-90 leading-relaxed line-clamp-3 max-w-2xl font-medium">
            {hero.description}
          </p>
        )}
      </div>

    </div>
  )
}
