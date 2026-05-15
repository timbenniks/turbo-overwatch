import { formatPercent } from '@/lib/format'
import type { PlayerSummary, PlayerStatsSummary, Role, Rank } from '@/types/overfast'

const ROLES: Role[] = ['tank', 'damage', 'support']

const ROLE_LABELS: Record<Role, string> = {
  tank: 'Tank',
  damage: 'Damage',
  support: 'Support',
}

const ROLE_TEXT: Record<Role, string> = {
  tank: 'text-role-tank',
  damage: 'text-role-damage',
  support: 'text-role-support',
}

const ROLE_BORDER: Record<Role, string> = {
  tank: 'border-l-role-tank',
  damage: 'border-l-role-damage',
  support: 'border-l-role-support',
}

const DIVISION_COLORS: Record<string, string> = {
  bronze: '#a16207',
  silver: '#a1a1aa',
  gold: '#fbbf24',
  platinum: '#67e8f9',
  diamond: '#a5b4fc',
  master: '#fb923c',
  grandmaster: '#fb7185',
  champion: '#f0abfc',
}

export function RoleRankStripe({
  summary,
  stats,
}: {
  summary: PlayerSummary
  stats: PlayerStatsSummary
}) {
  const pcRanks = summary.competitive?.pc

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {ROLES.map((role) => {
        const rank = pcRanks?.[role] ?? null
        const roleStats = stats.roles[role]

        return (
          <div
            key={role}
            className={`bg-surface-card border border-border-default ${ROLE_BORDER[role]} border-l-4 rounded-2xl p-6 flex flex-col`}
          >
            <div className="flex items-center justify-between mb-5">
              <div className={`text-[13px] uppercase tracking-[0.2em] font-black ${ROLE_TEXT[role]}`}>
                {ROLE_LABELS[role]}
              </div>
              <span className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold">
                {roleStats.games_played} games
              </span>
            </div>

            <RankDisplay rank={rank} />

            <div className="mt-5 pt-5 border-t border-border-default flex items-baseline justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary font-bold mb-1">
                  Win rate
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[32px] md:text-[40px] font-black leading-none tracking-tight">
                    {formatPercent(roleStats.winrate)}
                  </span>
                  <span className="text-[11px] text-text-tertiary uppercase tracking-widest font-bold">
                    {roleStats.games_won}W · {roleStats.games_lost}L
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary font-bold mb-1">
                  KDA
                </div>
                <div className="text-[32px] md:text-[40px] font-black leading-none tracking-tight">
                  {roleStats.kda.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RankDisplay({ rank }: { rank: Rank | null }) {
  if (!rank) {
    return (
      <div className="flex items-center gap-3 h-16">
        <div className="w-14 h-14 rounded-full border-2 border-dashed border-border-strong flex items-center justify-center">
          <span className="text-[9px] uppercase tracking-widest text-text-tertiary font-black">—</span>
        </div>
        <div>
          <div className="text-[18px] md:text-[20px] font-black uppercase tracking-tight text-text-tertiary">
            Unranked
          </div>
          <div className="text-[10px] uppercase tracking-widest text-text-tertiary font-bold mt-1">
            No comp games yet
          </div>
        </div>
      </div>
    )
  }

  const color = DIVISION_COLORS[rank.division.toLowerCase()] ?? '#a1a1aa'

  return (
    <div className="flex items-center gap-3 h-16">
      <div className="relative w-14 h-14 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={rank.rank_icon}
          alt={`${rank.division} rank`}
          className="w-full h-full object-contain"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={rank.tier_icon}
          alt=""
          className="absolute -bottom-1 -right-1 w-7 h-7 object-contain"
        />
      </div>
      <div>
        <div
          className="text-[20px] md:text-[24px] font-black uppercase tracking-tight leading-none"
          style={{ color }}
        >
          {rank.division}
        </div>
        <div className="text-[12px] uppercase tracking-[0.2em] text-text-secondary font-bold mt-1">
          Division {rank.tier}
        </div>
      </div>
    </div>
  )
}
