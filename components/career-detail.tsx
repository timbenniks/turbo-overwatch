import { getPlayerStatsDeep } from '@/lib/overfast'
import { PLAYER_ID } from '@/lib/constants'
import { SectionHeader } from '@/components/section-header'
import { PercentileCallout } from '@/components/percentile-callout'
import { Award, Bolt } from '@/components/icons'
import { percentile } from '@/lib/stats-helpers'
import { formatTime, formatNumber } from '@/lib/format'
import type { Gamemode } from '@/types/overfast'

export async function CareerDetail({ gamemode }: { gamemode: Gamemode }) {
  const deep = await getPlayerStatsDeep(PLAYER_ID, { gamemode, hero: 'all-heroes' })
  const categories = deep?.['all-heroes'] ?? []
  if (categories.length === 0) return null

  const find = (cat: string, key: string): number => {
    const c = categories.find((x) => x.category === cat)
    const v = c?.stats.find((s) => s.key === key)?.value
    return typeof v === 'number' ? v : 0
  }

  const totals = {
    elims: find('combat', 'eliminations'),
    heroDamage: find('combat', 'hero_damage_done'),
    objTime: find('combat', 'objective_time'),
    gamesWon: find('game', 'games_won'),
    deaths: find('combat', 'deaths'),
    assists: find('assists', 'assists'),
    finalBlows: find('combat', 'final_blows'),
    objKills: find('combat', 'objective_kills'),
    soloKills: find('combat', 'solo_kills'),
    multikills: find('combat', 'multikills'),
    offAssists: find('assists', 'offensive_assists'),
    defAssists: find('assists', 'defensive_assists'),
    meleeFB: find('combat', 'melee_final_blows'),
    envKills: find('combat', 'environmental_kills'),
    cards: find('match_awards', 'cards'),
    healing: find('assists', 'healing_done'),
    barrierDamage: find('combat', 'barrier_damage_done'),
    timeOnFire: find('combat', 'time_spent_on_fire'),
  }

  const per10 = {
    elims: find('average', 'eliminations_avg_per_10_min'),
    damage: find('average', 'hero_damage_done_avg_per_10_min'),
    deaths: find('average', 'deaths_avg_per_10_min'),
    assists: find('average', 'assists_avg_per_10_min'),
    finalBlows: find('average', 'final_blows_avg_per_10_min'),
    objKills: find('average', 'objective_kills_avg_per_10_min'),
    soloKills: find('average', 'solo_kills_avg_per_10_min'),
    healing: find('average', 'healing_done_avg_per_10_min'),
    timeOnFire: find('average', 'time_spent_on_fire_avg_per_10_min'),
  }

  const objTimeFmt = formatTime(totals.objTime)

  return (
    <div className="space-y-12">
      <section>
        <SectionHeader icon={<Award size={22} />}>Career totals</SectionHeader>

        <div className="bg-surface-card border border-border-default rounded-2xl grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border-default mb-6">
          <BigCell label="Eliminations" value={formatNumber(totals.elims)} />
          <BigCell label="Hero damage" value={formatNumber(totals.heroDamage)} />
          <BigCell label="Objective time" value={`${objTimeFmt.value}${objTimeFmt.unit}`} />
          <BigCell label="Games won" value={String(totals.gamesWon)} />
        </div>

        <div className="bg-surface-card border border-border-default rounded-2xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-border-default">
          <SmallCell label="Deaths" value={formatNumber(totals.deaths)} />
          <SmallCell label="Assists" value={formatNumber(totals.assists)} />
          <SmallCell label="Final blows" value={formatNumber(totals.finalBlows)} />
          <SmallCell label="Objective kills" value={formatNumber(totals.objKills)} />
          <SmallCell label="Solo kills" value={formatNumber(totals.soloKills)} />
          <SmallCell label="Multikills" value={formatNumber(totals.multikills)} />
        </div>

        <div className="bg-surface-card border border-border-default rounded-2xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-border-default mt-3">
          <SmallCell label="Offensive assists" value={formatNumber(totals.offAssists)} />
          <SmallCell label="Defensive assists" value={formatNumber(totals.defAssists)} />
          <SmallCell label="Melee final blows" value={formatNumber(totals.meleeFB)} />
          <SmallCell label="Env. kills" value={formatNumber(totals.envKills)} />
          <SmallCell label="Healing" value={formatNumber(totals.healing)} />
          <SmallCell label="Cards" value={formatNumber(totals.cards)} />
        </div>
      </section>

      <section>
        <SectionHeader icon={<Bolt size={22} />}>Performance / 10min</SectionHeader>

        <div className="bg-surface-card border border-border-default rounded-2xl grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border-default mb-6">
          <BigCell
            label="Elims / 10m"
            value={per10.elims.toFixed(1)}
            callout={<PercentileCallout result={percentile('elims_per_10', per10.elims)} />}
          />
          <BigCell
            label="Damage / 10m"
            value={`${(per10.damage / 1000).toFixed(1)}k`}
            callout={<PercentileCallout result={percentile('damage_per_10', per10.damage)} />}
          />
          <BigCell
            label="Deaths / 10m"
            value={per10.deaths.toFixed(1)}
            callout={<PercentileCallout result={percentile('deaths_per_10', per10.deaths)} />}
          />
          <BigCell
            label="Healing / 10m"
            value={per10.healing >= 1000 ? `${(per10.healing / 1000).toFixed(1)}k` : per10.healing.toFixed(0)}
          />
        </div>

        <div className="bg-surface-card border border-border-default rounded-2xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-x divide-y lg:divide-y-0 divide-border-default">
          <SmallCell label="Assists / 10m" value={per10.assists.toFixed(1)} />
          <SmallCell label="Final blows / 10m" value={per10.finalBlows.toFixed(1)} />
          <SmallCell label="Obj. kills / 10m" value={per10.objKills.toFixed(1)} />
          <SmallCell label="Solo kills / 10m" value={per10.soloKills.toFixed(1)} />
          <SmallCell label="On-fire / 10m" value={`${Math.round(per10.timeOnFire)}s`} />
        </div>
      </section>
    </div>
  )
}

function BigCell({
  label,
  value,
  callout,
}: {
  label: string
  value: string
  callout?: React.ReactNode
}) {
  return (
    <div className="p-4 md:p-6">
      <div className="text-[11px] uppercase tracking-[0.2em] text-text-tertiary font-bold">
        {label}
      </div>
      <div className="text-[26px] md:text-[44px] font-black mt-2 leading-none tracking-tight">
        {value}
      </div>
      {callout && <div className="mt-3">{callout}</div>}
    </div>
  )
}

function SmallCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 md:p-5">
      <div className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary font-bold">
        {label}
      </div>
      <div className="text-[20px] md:text-[28px] font-black mt-1.5 leading-none tracking-tight">
        {value}
      </div>
    </div>
  )
}
