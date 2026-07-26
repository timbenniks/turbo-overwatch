import Image from 'next/image'
import { SectionHeader } from '@/components/section-header'
import { Star } from '@/components/icons'
import type { HeroPerk, HeroPerks as Perks } from '@/types/overfast'

// "Minor" and "Major" are the API's own words. They map to in-game unlock
// levels, but the payload doesn't say which, so neither does this.
export function HeroPerks({ perks }: { perks?: Perks }) {
  const minor = perks?.minor ?? []
  const major = perks?.major ?? []
  if (minor.length === 0 && major.length === 0) return null

  return (
    <section>
      <SectionHeader icon={<Star size={22} />}>Perks</SectionHeader>

      <div className="space-y-4 md:space-y-5">
        <PerkGroup label="Minor" perks={minor} />
        <PerkGroup label="Major" perks={major} />
      </div>
    </section>
  )
}

function PerkGroup({ label, perks }: { label: string; perks: HeroPerk[] }) {
  if (perks.length === 0) return null

  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-text-tertiary font-bold mb-2">
        {label}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {perks.map((p) => (
          <div
            key={p.name}
            className="bg-surface-card border border-border-default rounded-2xl p-4 md:p-5 flex gap-4"
          >
            <div className="shrink-0 w-11 h-11 rounded-lg bg-surface-card-active flex items-center justify-center overflow-hidden">
              {p.icon && (
                <Image
                  src={p.icon}
                  alt=""
                  width={44}
                  height={44}
                  quality={100}
                  className="w-8 h-8 object-contain"
                />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-[14px] md:text-[16px] font-black uppercase tracking-tight leading-tight">
                {p.name}
              </h3>
              {p.description && (
                <p className="text-[12px] md:text-[13px] text-text-secondary mt-1.5 leading-relaxed">
                  {p.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
