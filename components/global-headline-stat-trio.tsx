import { StatTile } from '@/components/stats/stat-tile'
import { formatPercent } from '@/lib/format'
import type { GlobalHeroStat } from '@/types/overfast'

export function GlobalHeadlineStatTrio({
  heroKey,
  globalStats,
  globalLabel,
}: {
  heroKey: string
  globalStats: GlobalHeroStat[]
  globalLabel: string
}) {
  const self = globalStats.find((h) => h.hero === heroKey)
  const byPick = [...globalStats].sort((a, b) => b.pickrate - a.pickrate)
  const pickRank = byPick.findIndex((h) => h.hero === heroKey) + 1
  const byWin = [...globalStats].sort((a, b) => b.winrate - a.winrate)
  const winRank = byWin.findIndex((h) => h.hero === heroKey) + 1

  if (!self) {
    return (
      <div className="bg-surface-card border border-border-default rounded-2xl p-8 text-center">
        <p className="text-[16px] md:text-[22px] uppercase font-black tracking-tight">
          No global meta for this hero yet.
        </p>
        <p className="text-text-secondary text-[12px] mt-3 uppercase tracking-widest font-bold">
          {globalLabel}
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-[11px] md:text-[12px] uppercase tracking-[0.2em] text-text-tertiary font-bold mb-3">
        {globalLabel}
      </p>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card>
          <StatTile
            label="Pick rate"
            value={formatPercent(self.pickrate)}
            size="lg"
            note={pickRank > 0 ? `${ordinal(pickRank)} most picked` : undefined}
          />
        </Card>
        <Card>
          <StatTile
            label="Win rate"
            value={formatPercent(self.winrate)}
            size="lg"
            note={winRank > 0 ? `${ordinal(winRank)} winrate` : undefined}
          />
        </Card>
        <Card>
          <StatTile
            label="Meta rank"
            value={pickRank > 0 ? `#${pickRank}` : '—'}
            size="lg"
            note={`of ${globalStats.length} heroes`}
          />
        </Card>
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-surface-card border border-border-default rounded-2xl">{children}</div>
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
