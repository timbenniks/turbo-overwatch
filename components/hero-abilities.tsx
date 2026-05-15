import { SectionHeader } from '@/components/section-header'
import { Sparkles } from '@/components/icons'
import type { HeroAbility } from '@/types/overfast'

export function HeroAbilities({ abilities }: { abilities: HeroAbility[] }) {
  if (!abilities || abilities.length === 0) return null

  return (
    <section>
      <SectionHeader icon={<Sparkles size={22} />}>Abilities</SectionHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {abilities.map((a, i) => (
          <div
            key={a.name}
            className="bg-surface-card border border-border-default rounded-2xl p-5 flex gap-4"
          >
            <div className="shrink-0 w-14 h-14 rounded-xl bg-surface-card-active flex items-center justify-center overflow-hidden">
              {a.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.icon}
                  alt=""
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <span className="text-text-tertiary text-[18px] font-black">
                  {i + 1}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[16px] md:text-[18px] font-black uppercase tracking-tight leading-tight">
                {a.name}
              </h3>
              {a.description && (
                <p className="text-[13px] text-text-secondary mt-2 leading-relaxed">
                  {a.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
