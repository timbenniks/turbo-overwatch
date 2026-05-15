import {
  getPlayerSummary,
  getPlayerStatsSummary,
  getHero,
  getHeroList,
} from '@/lib/overfast'
import { PLAYER_ID } from '@/lib/constants'

export default async function ApiDevPage() {
  const [summary, stats, heroes, genji] = await Promise.all([
    getPlayerSummary(PLAYER_ID),
    getPlayerStatsSummary(PLAYER_ID, { gamemode: 'quickplay' }),
    getHeroList(),
    getHero('genji'),
  ])

  const heroKeys = Object.keys(stats?.heroes ?? {})

  return (
    <main className="p-8 font-mono text-[12px] space-y-6 max-w-4xl">
      <header>
        <h1 className="text-[18px] font-bold">API dev — {PLAYER_ID}</h1>
        <p className="text-text-tertiary">Cache hit shows in the dev server log timing.</p>
      </header>

      <section>
        <h2 className="font-bold mb-1">player summary</h2>
        <pre className="bg-surface-card border border-border-default rounded p-3 overflow-auto text-[11px]">
          {JSON.stringify(
            summary && {
              username: summary.username,
              title: summary.title,
              endorsement: summary.endorsement?.level,
              ranks_pc: summary.competitive?.pc
                ? Object.fromEntries(
                    (['tank', 'damage', 'support'] as const).map((r) => [
                      r,
                      summary.competitive!.pc?.[r]
                        ? `${summary.competitive!.pc![r]!.division} ${summary.competitive!.pc![r]!.tier}`
                        : null,
                    ])
                  )
                : null,
            },
            null,
            2
          )}
        </pre>
      </section>

      <section>
        <h2 className="font-bold mb-1">stats summary — {heroKeys.length} heroes played</h2>
        <p className="text-text-secondary">
          general winrate:{' '}
          <span className="font-bold">{stats?.general.winrate?.toFixed(1) ?? '—'}%</span>{' '}
          · games: {stats?.general.games_played ?? 0} · time_played:{' '}
          {Math.round((stats?.general.time_played ?? 0) / 3600)}h
        </p>
        <p className="text-text-tertiary mt-1 text-[11px]">{heroKeys.join(', ')}</p>
      </section>

      <section>
        <h2 className="font-bold mb-1">hero list ({heroes.length})</h2>
        <p className="text-text-tertiary text-[11px]">
          {heroes
            .slice(0, 10)
            .map((h) => h.key)
            .join(', ')}{' '}
          …
        </p>
      </section>

      <section>
        <h2 className="font-bold mb-1">genji</h2>
        <p>
          backgrounds: <span className="font-bold">{genji?.backgrounds?.length ?? 0}</span>{' '}
          · abilities: <span className="font-bold">{genji?.abilities?.length ?? 0}</span> ·
          role: {genji?.role}
        </p>
      </section>
    </main>
  )
}
