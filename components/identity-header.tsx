import Image from 'next/image'
import type { PlayerSummary } from '@/types/overfast'

export function IdentityHeader({ summary }: { summary: PlayerSummary }) {
  const [username, tag] = summary.username.split('#')

  return (
    <header className="relative border-b border-border-default">
      <div className="px-6 md:px-16 py-8 flex items-center gap-5 max-w-400 mx-auto">
        <Image
          src={summary.avatar}
          alt={`${username} avatar`}
          width={96}
          height={96}
          quality={100}
          className="rounded-full ring-2 ring-border-strong w-20 h-20 md:w-24 md:h-24"
        />
        <div className="flex-1">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-[36px] md:text-[56px] leading-none font-black uppercase tracking-tight">
              {username}
            </h1>
            {tag && (
              <span className="text-[14px] md:text-[18px] text-text-tertiary font-bold">
                #{tag}
              </span>
            )}
          </div>
          {summary.title && (
            <p className="text-[12px] md:text-[14px] uppercase tracking-[0.2em] text-text-secondary font-bold mt-2">
              {summary.title}
            </p>
          )}
        </div>
        {summary.endorsement && (
          <div className="hidden md:flex items-center gap-2 text-[12px] uppercase tracking-[0.2em] text-text-tertiary font-bold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={summary.endorsement.frame} alt="" width={32} height={32} />
            <span>Lvl {summary.endorsement.level}</span>
          </div>
        )}
      </div>
    </header>
  )
}
