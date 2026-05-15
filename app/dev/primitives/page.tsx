import { SectionHeader } from '@/components/section-header'
import { StatCard } from '@/components/stat-card'
import { PercentileCallout } from '@/components/percentile-callout'
import { RolePill } from '@/components/role-pill'
import { formatTime, formatPercent, formatNumber, formatKda } from '@/lib/format'

export default function PrimitivesDemo() {
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
        <SectionHeader>stat cards</SectionHeader>
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="TIME" value="47h 12" unit="m" />
          <StatCard
            label="WIN RATE"
            value="58"
            unit="%"
            subtitle={<PercentileCallout result={{ band: 'top', label: 'Top 12%' }} />}
          />
          <StatCard label="KDA" value="3.42" />
          <StatCard label="GAMES" value="312" subtitle="182W · 130L" />
        </div>
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
        <SectionHeader>percentile callouts</SectionHeader>
        <div className="flex gap-6 items-center">
          <PercentileCallout result={{ band: 'top', label: 'Top 12%' }} />
          <PercentileCallout result={{ band: 'mid', label: 'Avg 50%' }} />
          <PercentileCallout result={{ band: 'warn', label: 'Bottom 17%' }} />
        </div>
      </section>
    </main>
  )
}
