import { getPlayerStatsDeepForView, type DeepCategory, type DeepStat } from '@/lib/overfast'
import { PLAYER_ID } from '@/lib/constants'
import { SectionHeader } from '@/components/section-header'
import { StatTile, StatTileRow } from '@/components/stats/stat-tile'
import { StatTable, type StatGroup, type StatRow } from '@/components/stats/stat-table'
import { Award, Bolt } from '@/components/icons'
import { formatTime, formatNumber, formatPercent, formatRate } from '@/lib/format'
import type { ViewMode } from '@/lib/view-mode'

// Two sections, two questions:
//   Career totals — what have I accumulated? (a raw total means nothing until
//                   it is divided by matches played)
//   Play profile  — what kind of player am I? (ratios the per-10 averages
//                   cannot express on their own)
// Everything else lives in a collapsed table rather than competing for
// attention in an undifferentiated grid.

// Per-game records belong to Best moments; per-10 rates get their own section.
const RECORD_SUFFIXES = ['_most_in_game', '_best_in_game', '_most_in_life', '_best']

export async function CareerDetail({ view }: { view: ViewMode }) {
  const deep = await getPlayerStatsDeepForView(PLAYER_ID, view, { hero: 'all-heroes' })
  const categories = deep?.['all-heroes'] ?? []
  if (categories.length === 0) return null

  const find = (cat: string, key: string): number => {
    const c = categories.find((x) => x.category === cat)
    const v = c?.stats.find((s) => s.key === key)?.value
    return typeof v === 'number' ? v : 0
  }

  const games = find('game', 'games_played')
  const timePlayed = find('game', 'time_played')
  const elims = find('combat', 'eliminations')
  const deaths = find('combat', 'deaths')
  const finalBlows = find('combat', 'final_blows')
  const heroDamage = find('combat', 'hero_damage_done')
  const objTime = find('combat', 'objective_time')
  const objContest = find('combat', 'objective_contest_time')
  const onFireTime = find('combat', 'time_spent_on_fire')
  const onFirePct = find('combat', 'of_match_on_fire')
  const gamesWon = find('game', 'games_won')

  const perMatch = (v: number): string | undefined =>
    games > 0 ? `${formatRate(v / games)} / match` : undefined

  // Not every total divides meaningfully. A percentage over matches is
  // nonsense, games-per-match is always 1, and a duration has to stay a
  // duration or "57.0 / match" reads as a count.
  const perMatchOf = (s: DeepStat): string | undefined => {
    if (typeof s.value !== 'number' || games === 0) return undefined
    if (isPercentKey(s.key) || isGameCountKey(s.key)) return undefined
    const v = s.value / games
    return isTimeKey(s.key) ? `${timeStr(v)} / match` : `${formatRate(v)} / match`
  }

  const share = (part: number): string | null =>
    timePlayed > 0 ? formatPercent((part / timePlayed) * 100) : null

  const objTimeFmt = formatTime(objTime)
  const onFireFmt = formatTime(onFireTime)
  const objShare = share(objTime)

  // of_match_on_fire is only reported on the all-heroes payload; derive it from
  // the raw seconds when it is absent.
  const onFireShare = onFirePct > 0 ? formatPercent(onFirePct) : share(onFireTime)

  const totalsGroups: StatGroup[] = [
    group(categories, 'combat', 'Combat', perMatchOf),
    group(categories, 'assists', 'Assists & healing', perMatchOf),
    group(categories, 'game', 'Matches', perMatchOf),
    group(categories, 'match_awards', 'Awards', perMatchOf),
  ]

  // A per-10 rate converts to a per-match figure through the average match
  // length — same time base, so the arithmetic holds.
  const avgMatch = games > 0 ? timePlayed / games : 0
  const per10Group = group(
    categories,
    'average',
    'Per 10 minutes',
    (s) => {
      if (typeof s.value !== 'number' || avgMatch === 0) return undefined
      const v = (s.value * avgMatch) / 600
      return isTimeKey(s.key) ? `${timeStr(v)} / match` : `${formatRate(v)} / match`
    },
    // These are already averages, so 6.5 must not round to 7. And the group
    // heading says "per 10 minutes" — every label repeating it is noise.
    { precise: true, stripSuffix: / - avg per 10 min$/i }
  )

  return (
    <div className="space-y-12">
      <section>
        <SectionHeader icon={<Award size={22} />}>Career totals</SectionHeader>

        <StatTileRow>
          <StatTile label="Eliminations" value={formatNumber(elims)} note={perMatch(elims)} />
          <StatTile
            label="Hero damage"
            value={formatNumber(heroDamage)}
            note={perMatch(heroDamage)}
          />
          <StatTile
            label="Objective time"
            value={objTimeFmt.value}
            unit={objTimeFmt.unit}
            note={objShare ? `${objShare} of playtime` : undefined}
          />
          <StatTile
            label="Games won"
            value={String(gamesWon)}
            note={games > 0 ? `${formatPercent((gamesWon / games) * 100)} of ${games}` : undefined}
          />
        </StatTileRow>

        <div className="mt-3">
          <StatTable
            summary="All career totals"
            groups={totalsGroups}
            secondaryHeading="Per match"
          />
        </div>
      </section>

      <section>
        <SectionHeader icon={<Bolt size={22} />}>Play profile</SectionHeader>

        <StatTileRow>
          <StatTile
            label="Elims per death"
            value={deaths > 0 ? (elims / deaths).toFixed(2) : null}
            note={`${formatNumber(elims)} elims · ${formatNumber(deaths)} deaths`}
          />
          <StatTile
            label="Damage per final blow"
            value={finalBlows > 0 ? formatNumber(heroDamage / finalBlows) : null}
            note={`${formatNumber(finalBlows)} final blows`}
          />
          <StatTile
            label="On the objective"
            value={objShare}
            note={objContest > 0 ? `${share(objContest)} contesting` : undefined}
          />
          <StatTile
            label="On fire"
            value={onFireShare}
            note={`${onFireFmt.value}${onFireFmt.unit} of playtime`}
          />
        </StatTileRow>

        <div className="mt-3">
          <StatTable
            summary="All per-10-minute averages"
            groups={[per10Group]}
            secondaryHeading="Per match"
          />
        </div>
      </section>
    </div>
  )
}

/**
 * Build table rows from a category, using the API's own labels. Duplicate keys
 * (the payload repeats some — games_won appears three times for a hero) collapse
 * to the first occurrence.
 */
function group(
  categories: DeepCategory[],
  category: string,
  label: string,
  secondary: (s: DeepStat) => string | undefined,
  opts: { precise?: boolean; stripSuffix?: RegExp } = {}
): StatGroup {
  const stats = categories.find((c) => c.category === category)?.stats ?? []
  const seen = new Set<string>()
  const rows: StatRow[] = []

  for (const s of stats) {
    if (seen.has(s.key)) continue
    if (RECORD_SUFFIXES.some((suf) => s.key.endsWith(suf))) continue
    // all-heroes reports damage_done identical to hero_damage_done.
    if (s.key === 'damage_done') continue
    seen.add(s.key)
    rows.push({
      label: opts.stripSuffix ? s.label.replace(opts.stripSuffix, '') : s.label,
      value: formatStat(s, opts.precise ?? false),
      secondary: secondary(s),
    })
  }

  return { label, rows }
}

function isTimeKey(key: string): boolean {
  return key.includes('time') && key !== 'time_spent_on_fire_percentage'
}

function isPercentKey(key: string): boolean {
  return key.includes('accuracy') || key.startsWith('of_match') || key.endsWith('percentage')
}

// games-per-match is always 1 — the whole group carries no per-match meaning.
function isGameCountKey(key: string): boolean {
  return key.startsWith('games_') || key === 'hero_wins'
}

function timeStr(seconds: number): string {
  const t = formatTime(Math.round(seconds))
  return `${t.value}${t.unit}`
}

function formatStat(s: DeepStat, precise: boolean): string {
  if (typeof s.value === 'string') return s.value
  if (isPercentKey(s.key)) return formatPercent(s.value)
  if (isTimeKey(s.key)) return timeStr(s.value)
  return precise ? formatRate(s.value) : formatNumber(s.value)
}
