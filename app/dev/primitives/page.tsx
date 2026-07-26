import { notFound } from 'next/navigation'
import { SectionHeader } from '@/components/section-header'
import { StatTile, StatTileRow } from '@/components/stats/stat-tile'
import { StatTable } from '@/components/stats/stat-table'
import { RolePill } from '@/components/role-pill'
import { formatTime, formatPercent, formatNumber, formatKda } from '@/lib/format'

export default function PrimitivesDemo() {
  // Internal showcase — prerendered into the production build otherwise,
  // where it is a public URL nobody intended to publish.
  if (process.env.NODE_ENV === 'production') notFound()

  const time = formatTime(170_000)

  return (
    <main className="p-8 max-w-5xl space-y-10">
      <header>
        <h1 className="font-serif text-[28px] leading-none">primitives demo</h1>
        <p className="text-text-tertiary text-[12px] mt-2">
          formatTime(170000) = {time.value}
          {time.unit} · formatPercent(58.4) = {formatPercent(58.4)} · formatNumber(12345) ={' '}
          {formatNumber(12345)} · formatKda(3.418) = {formatKda(3.418)}
        </p>
      </header>

      <section>
        <SectionHeader>section header</SectionHeader>
        <p className="text-text-secondary text-[13px]">
          A tiny bar + uppercase label. Used at the top of every Home section.
        </p>
      </section>

      <section>
        <SectionHeader>stat tiles</SectionHeader>
        <StatTileRow>
          <StatTile label="Time" value="47h 12" unit="m" note="3rd most played" />
          <StatTile
            label="Win rate"
            value="58%"
            delta={{ value: 4.2, format: (v) => `${v.toFixed(1)} pts`, period: 'vs prev 30d' }}
            spark={[41, 44, 43, 48, 52, null, 55, 58, 57, 61]}
            note="61% last 30d"
          />
          <StatTile
            label="Deaths / 10m"
            value="6.97"
            delta={{
              value: 0.4,
              format: (v) => v.toFixed(2),
              period: 'vs prev 30d',
              higherIsBetter: false,
            }}
          />
          <StatTile label="Healing / 10m" value={null} note="no data" />
        </StatTileRow>
      </section>

      <section>
        <SectionHeader>role pills</SectionHeader>
        <div className="flex gap-3">
          <RolePill role="tank" division="D3" />
          <RolePill role="damage" division="P1" />
          <RolePill role="support" />
        </div>
      </section>

      <section>
        <SectionHeader>stat table</SectionHeader>
        <StatTable
          summary="All career totals"
          secondaryHeading="Per match"
          groups={[
            {
              label: 'Combat',
              rows: [
                { label: 'Final blows', value: '1,461', secondary: '5.1 / match' },
                { label: 'Solo kills', value: '289', secondary: '1.0 / match' },
                { label: 'Multikills', value: '62', secondary: '0.2 / match' },
              ],
            },
            {
              label: 'Assists',
              rows: [{ label: 'Healing done', value: '315.8k', secondary: '1.1k / match' }],
            },
          ]}
        />
      </section>

    </main>
  )
}
