import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getPlayerSummary } from '@/lib/overfast'
import { PLAYER_ID } from '@/lib/constants'
import { ModeToggle } from '@/components/mode-toggle'

export async function SiteHeader() {
  const summary = await getPlayerSummary(PLAYER_ID)
  const [username, tag] = summary?.username.split('#') ?? [null, null]

  return (
    <header className="sticky top-0 z-30 w-full bg-surface-canvas/80 backdrop-blur-md border-b border-border-default">
      <div className="max-w-400 mx-auto px-4 md:px-16 h-14 md:h-16 flex items-center justify-between gap-6">
        <Link
          href="/"
          className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
        >
          {summary && (
            <Image
              src={summary.avatar}
              alt=""
              width={36}
              height={36}
              quality={100}
              className="rounded-full ring-1 ring-white/20 w-8 h-8 md:w-9 md:h-9 shrink-0"
            />
          )}
          <span className="text-[13px] md:text-[15px] uppercase tracking-[0.2em] font-black truncate">
            {username ?? 'Overwatch'}
            {tag && (
              <span className="text-text-tertiary font-bold ml-1.5">#{tag}</span>
            )}
          </span>
        </Link>
        <div className="flex items-center gap-4 md:gap-6">
          {summary?.endorsement && (
            <div className="hidden sm:flex items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-text-secondary font-bold">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={summary.endorsement.frame}
                alt=""
                width={28}
                height={28}
                className="w-7 h-7"
              />
              <span className="hidden md:inline">Lvl {summary.endorsement.level}</span>
            </div>
          )}
          <Suspense fallback={null}>
            <ModeToggle />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
