import Link from "next/link";
import Image from "next/image";
import { getHeroPortrait } from "@/lib/hero-assets";
import { getHeroTheme } from "@/lib/hero-theme";
import { formatTime, formatPercent } from "@/lib/format";
import type { ViewMode } from "@/lib/view-mode";
import type { PlayerStatsSummary, Role } from "@/types/overfast";
import { CountUp } from "@/components/count-up";

const MODE_LABEL: Record<ViewMode, string> = {
  all: "Most played overall",
  quickplay: "Most played · Quickplay",
  competitive: "Most played · Competitive",
};

export function HeroSpotlight({
  stats,
  view,
  heroRoles,
  heroNames,
}: {
  stats: PlayerStatsSummary;
  view: ViewMode;
  heroRoles: Record<string, Role>;
  heroNames: Record<string, string>;
}) {
  const sorted = Object.entries(stats.heroes).sort(
    ([, a], [, b]) => b.time_played - a.time_played,
  );
  const top = sorted[0];
  if (!top) return null;

  const [key, heroStats] = top;
  const role = heroRoles[key];
  const theme = getHeroTheme(key, role);
  const portrait = getHeroPortrait(key);
  const name = heroNames[key] ?? key.replace(/-/g, " ");
  const time = formatTime(heroStats.time_played);

  return (
    <section className="relative w-full h-[85vh] min-h-160 overflow-hidden">
      {portrait && (
        <div className="absolute inset-0 ken-burns">
          <Image
            src={portrait}
            alt={name}
            fill
            priority
            sizes="100vw"
            quality={100}
            loading="eager"
            className="object-cover object-[70%_20%] md:object-[center_20%]"
          />
        </div>
      )}
      <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/70 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-surface-canvas via-surface-canvas/70 to-transparent" />

      <div className="relative h-full flex flex-col justify-end px-4 md:px-16 max-w-400 mx-auto pb-12 md:pb-24 rise-in">
        <div className="flex items-center gap-3 mb-6">
          <span
            className="text-[11px] md:text-[12px] uppercase tracking-[0.25em] font-bold px-3 py-1.5 rounded-full"
            style={{ background: theme.primary, color: "#07070a" }}
          >
            {MODE_LABEL[view]}
          </span>
          {role && (
            <span className="text-[11px] md:text-[12px] uppercase tracking-[0.25em] font-bold text-white/90">
              {role}
            </span>
          )}
        </div>

        <h1 className="text-[48px] md:text-[160px] leading-[0.85] font-black uppercase tracking-tighter text-white">
          {name}
        </h1>

        <div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-4">
          <Stat label="Time" value={time.value} unit={time.unit} />
          <Stat
            label="Win rate"
            value={
              <CountUp value={heroStats.winrate} decimals={0} suffix="%" />
            }
          />
          <Stat
            label="KDA"
            value={<CountUp value={heroStats.kda} decimals={2} />}
          />
          <Stat
            label="Games"
            value={<CountUp value={heroStats.games_played} />}
          />
        </div>

        <Link
          href={`/hero/${key}`}
          prefetch
          className="press-tactile mt-10 inline-flex items-center gap-2 self-start px-6 py-3 bg-white text-surface-canvas font-bold uppercase tracking-[0.15em] text-[13px] rounded-full hover:bg-text-secondary transition-colors"
        >
          View full breakdown →
        </Link>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
}) {
  return (
    <div>
      <div className="text-[10px] md:text-[11px] uppercase tracking-[0.25em] text-white/70 font-bold mb-1">
        {label}
      </div>
      <div className="text-[28px] md:text-[56px] font-black leading-none text-white">
        {value}
        {unit && (
          <span className="text-white/60 text-[18px] md:text-[32px] ml-1">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
