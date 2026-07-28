import type { HeroicEmote } from '@/lib/fandom'
import { SectionHeader } from '@/components/section-header'
import { Sparkles } from '@/components/icons'

export function HeroHeroicEmote({
  emote,
  heroName,
}: {
  emote: HeroicEmote
  heroName: string
}) {
  return (
    <section>
      <SectionHeader icon={<Sparkles size={22} />}>Heroic emote</SectionHeader>
      <div className="bg-surface-card border border-border-default rounded-2xl overflow-hidden max-w-xl">
        <video
          src={emote.url}
          autoPlay
          muted
          loop
          playsInline
          controls
          className="w-full aspect-video bg-black"
          aria-label={`${heroName} ${emote.name} emote`}
        />
        <div className="px-4 md:px-5 py-3 md:py-4 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[13px] md:text-[14px] uppercase tracking-[0.15em] font-black">
            {emote.name}
          </p>
          <a
            href={emote.wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-bold text-text-tertiary hover:text-text-secondary transition-colors"
          >
            via Overwatch Wiki
          </a>
        </div>
      </div>
    </section>
  )
}
