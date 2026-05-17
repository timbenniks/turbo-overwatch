import Link from "next/link";
import Image from "next/image";
import { getHeroPortrait } from "@/lib/hero-assets";
import { formatTime, formatPercent } from "@/lib/format";
import type { PlayerStatsSummary, StatsSummary } from "@/types/overfast";

export function MostPlayed({
  stats,
  heroNames,
}: {
  stats: PlayerStatsSummary;
  heroNames: Map<string, string>;
}) {
  const top3 = Object.entries(stats.heroes)
    .sort(([, a], [, b]) => b.time_played - a.time_played)
    .slice(0, 3);

  return (
    <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory -mx-6 px-6 md:mx-0 md:px-0 pb-2 md:pb-0">
      {top3.map(([key, heroStats], i) => (
        <div key={key} className="min-w-[78%] md:min-w-0 snap-start">
          <HeroCardLarge
            heroKey={key}
            name={heroNames.get(key) ?? prettify(key)}
            stats={heroStats}
            rank={i + 1}
          />
        </div>
      ))}
    </div>
  );
}

function HeroCardLarge({
  heroKey,
  name,
  stats,
  rank,
}: {
  heroKey: string;
  name: string;
  stats: StatsSummary;
  rank: number;
}) {
  const portrait = getHeroPortrait(heroKey);
  const time = formatTime(stats.time_played);

  return (
    <Link
      href={`/hero/${heroKey}`}
      prefetch
      className="relative block aspect-3/4 rounded-2xl overflow-hidden bg-surface-card border border-border-default group"
    >
      {portrait && (
        <Image
          src={portrait}
          alt={name}
          fill
          sizes="(max-width: 768px) 160vw, 70vw"
          quality={100}
          className="object-cover object-[70%_center] transition-transform duration-500 group-hover:scale-110"
        />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-transparent" />

      <span className="absolute top-4 left-4 text-[11px] md:text-[12px] uppercase tracking-[0.25em] font-bold text-white/90 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
        #{rank}
      </span>

      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 text-white">
        <h3 className="text-[20px] md:text-[36px] font-black uppercase leading-none tracking-tight">
          {name}
        </h3>
        <div className="text-[11px] md:text-[14px] mt-3 flex gap-4 md:gap-5 font-bold uppercase tracking-widest">
          <span>
            {time.value}
            <span className="text-white/60 ml-0.5">{time.unit}</span>
          </span>
          <span>{formatPercent(stats.winrate)} WR</span>
        </div>
      </div>
    </Link>
  );
}

function prettify(key: string): string {
  return key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
