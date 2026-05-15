import { observeCombat } from '@/lib/stats-helpers'
import { Crosshair, Bolt, Heart, Skull, Hand } from '@/components/icons'
import type { StatsSummary } from '@/types/overfast'
import type { ReactNode } from 'react'

export function CombatSignature({
  heroStats,
  generalStats,
}: {
  heroStats: StatsSummary
  generalStats: StatsSummary
}) {
  const healing = heroStats.average.healing
  const showHealing = healing > 0

  return (
    <div className="bg-surface-card border border-border-default rounded-2xl grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border-default">
      <Cell
        icon={<Crosshair size={14} />}
        label="Elims / 10m"
        value={heroStats.average.eliminations.toFixed(1)}
        note={observeCombat(heroStats, generalStats, 'elims')}
      />
      <Cell
        icon={<Bolt size={14} />}
        label="Damage / 10m"
        value={`${(heroStats.average.damage / 1000).toFixed(1)}k`}
        note={observeCombat(heroStats, generalStats, 'damage')}
      />
      {showHealing ? (
        <Cell
          icon={<Heart size={14} />}
          label="Healing / 10m"
          value={`${(healing / 1000).toFixed(1)}k`}
          note={null}
        />
      ) : (
        <Cell
          icon={<Hand size={14} />}
          label="Assists / 10m"
          value={heroStats.average.assists.toFixed(1)}
          note={null}
        />
      )}
      <Cell
        icon={<Skull size={14} />}
        label="Deaths / 10m"
        value={heroStats.average.deaths.toFixed(1)}
        note={observeCombat(heroStats, generalStats, 'deaths')}
      />
    </div>
  )
}

function Cell({
  icon,
  label,
  value,
  note,
}: {
  icon: ReactNode
  label: string
  value: string
  note: string | null
}) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-text-tertiary font-bold">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-[36px] md:text-[44px] font-black mt-2 leading-none tracking-tight">{value}</div>
      {note && (
        <div className="text-[11px] text-text-secondary mt-3 uppercase tracking-widest font-bold">{note}</div>
      )}
    </div>
  )
}
