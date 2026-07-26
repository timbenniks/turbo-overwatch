'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SectionHeader } from '@/components/section-header'
import { Sparkles } from '@/components/icons'
import type { HeroAbility } from '@/types/overfast'

// Ability browser: a tab list of abilities beside one 16:9 player.
//
// Chosen over a grid of cards for two reasons — a 2-up grid of clips on a wide
// screen makes each one bigger than the content warrants, and only one video is
// ever mounted here, so only one clip's bytes are ever fetched.
//
// Follows the ARIA tabs pattern with automatic activation: arrow keys move
// focus and switch the panel in one step, which is right when panels are cheap.

export function HeroAbilities({ abilities }: { abilities: HeroAbility[] }) {
  const [selected, setSelected] = useState(0)
  // False on first paint: nothing should move, or download, until asked.
  const [wantPlay, setWantPlay] = useState(false)
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  if (!abilities || abilities.length === 0) return null

  const active = abilities[selected] ?? abilities[0]
  const video = active.video
  const mp4 = video?.link?.mp4
  const webm = video?.link?.webm
  const hasVideo = Boolean(mp4 || webm)

  const reducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const select = (i: number) => {
    setSelected(i)
    // Picking an ability is a request to see it — except under reduced motion,
    // where the still is the answer until they click the player.
    setWantPlay(!reducedMotion())
    tabRefs.current[i]?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = abilities.length - 1
    const next =
      e.key === 'ArrowDown' || e.key === 'ArrowRight'
        ? selected === last
          ? 0
          : selected + 1
        : e.key === 'ArrowUp' || e.key === 'ArrowLeft'
          ? selected === 0
            ? last
            : selected - 1
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? last
              : null
    if (next === null) return
    e.preventDefault()
    select(next)
  }

  const togglePlay = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) {
      // play() rejects on teardown or a refused gesture; neither is actionable.
      el.play().then(
        () => setWantPlay(true),
        () => {}
      )
    } else {
      el.pause()
    }
  }, [])

  // Reset the crossfade whenever the selection changes — the new element starts
  // on its poster.
  useEffect(() => {
    setPlaying(false)
  }, [selected])

  return (
    <section>
      <SectionHeader icon={<Sparkles size={22} />}>Abilities</SectionHeader>

      {/* Capped on purpose: at full container width the 16:9 player runs past
          1200px and ~680px tall, which is more room than one clip earns. */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-3 md:gap-5 max-w-[1120px]">
        <div
          role="tablist"
          aria-label="Abilities"
          aria-orientation="vertical"
          onKeyDown={onKeyDown}
          className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 pb-1 md:pb-0"
        >
          {abilities.map((a, i) => {
            const isActive = i === selected
            return (
              <button
                key={a.name}
                ref={(el) => {
                  tabRefs.current[i] = el
                }}
                role="tab"
                id={`ability-tab-${i}`}
                aria-selected={isActive}
                aria-controls="ability-panel"
                // Roving tabindex: one stop for the whole list, arrows move within.
                tabIndex={isActive ? 0 : -1}
                onClick={() => select(i)}
                className={`shrink-0 md:w-full flex items-center gap-3 p-2.5 md:p-3 rounded-xl border text-left transition-colors press-tactile ${
                  isActive
                    ? 'bg-surface-card-active border-border-strong'
                    : 'bg-surface-card border-border-default hover:border-border-strong'
                }`}
              >
                <span className="shrink-0 w-9 h-9 rounded-lg bg-surface-elevated flex items-center justify-center overflow-hidden">
                  {a.icon ? (
                    <Image
                      src={a.icon}
                      alt=""
                      width={36}
                      height={36}
                      quality={100}
                      className="w-7 h-7 object-contain"
                    />
                  ) : (
                    <span className="text-text-tertiary text-[12px] font-black">{i + 1}</span>
                  )}
                </span>
                <span
                  className={`text-[11px] md:text-[12px] uppercase tracking-wide font-bold leading-tight whitespace-nowrap md:whitespace-normal ${
                    isActive ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  {a.name}
                </span>
              </button>
            )
          })}
        </div>

        <div
          role="tabpanel"
          id="ability-panel"
          aria-labelledby={`ability-tab-${selected}`}
          className="bg-surface-card border border-border-default rounded-2xl overflow-hidden"
        >
          <button
            type="button"
            onClick={hasVideo ? togglePlay : undefined}
            disabled={!hasVideo}
            aria-label={hasVideo ? `${playing ? 'Pause' : 'Play'} ${active.name} clip` : undefined}
            className="relative block w-full aspect-video bg-surface-card-active overflow-hidden cursor-pointer disabled:cursor-default"
          >
            {video?.thumbnail && (
              <Image
                key={`${active.name}-thumb`}
                src={video.thumbnail}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 70vw"
                quality={100}
                priority={selected === 0}
                className={`object-cover transition-opacity duration-500 ${
                  playing ? 'opacity-0' : 'opacity-100'
                }`}
              />
            )}

            {hasVideo && (
              <video
                // Remounting per ability is what keeps exactly one clip loaded.
                key={active.name}
                ref={videoRef}
                autoPlay={wantPlay}
                muted
                loop
                playsInline
                preload={wantPlay ? 'auto' : 'none'}
                onPlaying={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  playing ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {webm && <source src={webm} type="video/webm" />}
                {mp4 && <source src={mp4} type="video/mp4" />}
              </video>
            )}

            {hasVideo && !playing && (
              <span
                aria-hidden
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="w-14 h-14 rounded-full bg-surface-canvas/70 backdrop-blur-sm border border-border-strong flex items-center justify-center text-[16px] pl-0.5">
                  ▶
                </span>
              </span>
            )}
          </button>

          <div className="p-5 md:p-6">
            <h3 className="text-[17px] md:text-[22px] font-black uppercase tracking-tight leading-none">
              {active.name}
            </h3>
            {active.description && (
              <p className="text-[13px] md:text-[15px] text-text-secondary mt-3 leading-relaxed max-w-[70ch]">
                {active.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
