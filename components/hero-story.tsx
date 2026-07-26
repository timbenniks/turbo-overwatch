import Image from 'next/image'
import { SectionHeader } from '@/components/section-header'
import { Disclosure } from '@/components/disclosure'
import { User } from '@/components/icons'
import type { HeroStory as Story } from '@/types/overfast'

export function HeroStory({ story, heroName }: { story?: Story; heroName: string }) {
  const summary = story?.summary
  const chapters = story?.chapters ?? []
  const mediaLink = story?.media?.type === 'video' ? story.media.link : undefined
  if (!summary && chapters.length === 0) return null

  return (
    <section>
      <SectionHeader icon={<User size={22} />}>Story</SectionHeader>

      {summary && (
        <p className="text-[15px] md:text-[18px] text-text-secondary leading-relaxed max-w-3xl">
          {summary}
        </p>
      )}

      {mediaLink && (
        // A link, not an embed: an iframe would load third-party tracking on
        // every hero page for something most visitors never click.
        <a
          href={mediaLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-surface-card border border-border-default hover:border-border-strong text-[11px] uppercase tracking-[0.2em] font-bold text-text-secondary hover:text-text-primary transition-colors press-tactile"
        >
          Watch origin story
          <span aria-hidden>↗</span>
        </a>
      )}

      {chapters.length > 0 && (
        <div className="mt-5">
          <Disclosure summary={`${heroName}'s full story`} badge={chapters.length}>
            <div className="space-y-8 pt-1">
              {chapters.map((c) => (
                <article key={c.title} className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-6">
                  {c.picture ? (
                    <div className="relative aspect-4/3 md:aspect-square rounded-xl overflow-hidden bg-surface-card-active">
                      <Image
                        src={c.picture}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 200px"
                        quality={100}
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="hidden md:block" />
                  )}
                  <div>
                    <h3 className="text-[15px] md:text-[18px] font-black uppercase tracking-tight leading-none">
                      {c.title}
                    </h3>
                    {/* Chapters run 350–1300 characters; without a measure cap
                        the lines get too long to track on a wide screen. */}
                    <p className="text-[13px] md:text-[14px] text-text-secondary mt-3 leading-relaxed whitespace-pre-line max-w-[70ch]">
                      {c.content}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </Disclosure>
        </div>
      )}
    </section>
  )
}
