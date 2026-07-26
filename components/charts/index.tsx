'use client'

// All Recharts-backed charts live in this one client module: they share the
// same axis/grid/tooltip theme and none is useful on its own. Everything that
// can render without JS (heatmap, bar rows, card frame) stays a server
// component in its own file.

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  formatDayLabel,
  formatHours,
  formatKda,
  formatNumber,
  formatPercent,
  formatRankScore,
} from '@/lib/format'

// Formatters are selected by name, not passed as props — a server component
// cannot hand a function to a client component.
export type ValueFormat = 'percent' | 'kda' | 'count' | 'hours' | 'rank'

const FORMATTERS: Record<ValueFormat, (v: number) => string> = {
  percent: formatPercent,
  kda: formatKda,
  count: (v) => formatNumber(v),
  hours: formatHours,
  rank: (v) => formatRankScore(Math.round(v)),
}

export type SeriesSpec = { key: string; label: string; color: string }
export type ChartRow = Record<string, number | string | null>

const GRID = 'var(--color-chart-grid)'
const AXIS = 'var(--color-chart-axis)'
const MUTED = 'var(--color-chart-muted)'
const SURFACE = 'var(--color-surface-card)'

const TICK = { fill: 'var(--color-text-tertiary)', fontSize: 10, fontWeight: 700 } as const

const xAxisProps = {
  dataKey: 'date',
  stroke: AXIS,
  tick: TICK,
  tickLine: false,
  minTickGap: 36,
  interval: 'preserveStartEnd' as const,
  tickFormatter: formatDayLabel,
}

const yAxisProps = {
  stroke: AXIS,
  tick: TICK,
  tickLine: false,
  axisLine: false,
  width: 46,
}

/* ── tooltip ──────────────────────────────────────────────────────────────── */

type TipPayload = {
  name?: React.ReactNode
  value?: number | string | readonly (number | string)[] | null
  color?: string
  stroke?: string
  fill?: string
}

function Tip({
  active,
  payload,
  label,
  format,
  xKind = 'day',
  totalFormat,
}: {
  active?: boolean
  payload?: readonly TipPayload[]
  label?: string | number
  format: ValueFormat
  xKind?: 'day' | 'week'
  totalFormat?: ValueFormat
}) {
  if (!active || !payload || payload.length === 0) return null
  const fmt = FORMATTERS[format]
  // Drop empty series: a chart split into per-season lines carries a null for
  // every segment except the one under the cursor, and listing those as "—"
  // would bury the row that matters.
  const rows = payload.filter((p) => p.value !== undefined && p.value !== null)
  const numeric = rows
    .map((p) => (typeof p.value === 'number' ? p.value : null))
    .filter((v): v is number => v !== null)
  const total = numeric.reduce((a, b) => a + b, 0)

  return (
    <div className="bg-surface-elevated border border-border-default rounded-xl px-3 py-2.5 min-w-40 shadow-2xl">
      <div className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary font-bold">
        {xKind === 'week' ? 'Week of ' : ''}
        {typeof label === 'string' ? formatDayLabel(label) : label}
      </div>
      <div className="mt-1.5 space-y-1">
        {rows.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ background: p.color ?? p.stroke ?? p.fill }}
            />
            <span className="text-[11px] uppercase tracking-widest text-text-secondary font-bold">
              {p.name}
            </span>
            <span className="ml-auto text-[13px] font-black tabular-nums text-text-primary">
              {typeof p.value === 'number' ? fmt(p.value) : '—'}
            </span>
          </div>
        ))}
      </div>
      {totalFormat && rows.length > 1 && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border-default">
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary font-bold">
            Total
          </span>
          <span className="ml-auto text-[13px] font-black tabular-nums">
            {FORMATTERS[totalFormat](total)}
          </span>
        </div>
      )}
    </div>
  )
}

/* ── line / step chart ────────────────────────────────────────────────────── */

// Direct end-of-line label. Ink-colored on purpose — position next to the line
// carries identity, so the text does not need to wear the series color.
function endLabel(lastIndex: number, text: string) {
  function Render(props: { x?: number | string; y?: number | string; index?: number }) {
    const { x, y, index } = props
    if (index !== lastIndex) return null
    const px = Number(x)
    const py = Number(y)
    if (!Number.isFinite(px) || !Number.isFinite(py)) return null
    return (
      <text
        x={px + 8}
        y={py}
        dy={4}
        fontSize={10}
        fontWeight={800}
        letterSpacing="0.1em"
        fill="var(--color-text-secondary)"
      >
        {text.toUpperCase()}
      </text>
    )
  }
  return Render
}

function lastDefinedIndex(data: ChartRow[], key: string): number {
  for (let i = data.length - 1; i >= 0; i--) {
    if (typeof data[i][key] === 'number') return i
  }
  return -1
}

export function TimeSeriesChart({
  data,
  series,
  format,
  yDomain,
  yTicks,
  step = false,
  reference,
  bands,
  markers,
  height = 210,
  endLabels = false,
}: {
  data: ChartRow[]
  series: SeriesSpec[]
  format: ValueFormat
  yDomain?: [number | 'auto', number | 'auto']
  yTicks?: number[]
  step?: boolean
  reference?: { value: number; label: string }
  bands?: { from: number; to: number; label: string }[]
  /** Vertical event markers on the x axis — e.g. a competitive season change. */
  markers?: { x: string; label: string }[]
  height?: number
  endLabels?: boolean
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: endLabels ? 52 : 12, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        {bands?.map((b, i) => (
          <ReferenceArea
            key={b.label}
            y1={b.from}
            y2={b.to}
            fill="var(--color-text-primary)"
            fillOpacity={i % 2 === 0 ? 0.03 : 0}
            stroke="none"
            label={{
              value: b.label,
              position: 'insideLeft',
              fill: 'var(--color-text-tertiary)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.15em',
            }}
          />
        ))}
        <XAxis {...xAxisProps} />
        <YAxis
          {...yAxisProps}
          domain={yDomain}
          ticks={yTicks}
          tickFormatter={FORMATTERS[format]}
        />
        {reference && (
          <ReferenceLine
            y={reference.value}
            stroke={MUTED}
            strokeDasharray="4 4"
            label={{
              value: reference.label,
              position: 'insideTopRight',
              fill: 'var(--color-text-tertiary)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.15em',
            }}
          />
        )}
        {markers?.map((m) => (
          <ReferenceLine
            key={m.x}
            x={m.x}
            stroke="var(--color-text-primary)"
            strokeOpacity={0.35}
            strokeDasharray="2 3"
            label={{
              value: m.label,
              position: 'insideTopLeft',
              fill: 'var(--color-text-secondary)',
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.12em',
            }}
          />
        ))}
        <Tooltip
          cursor={{ stroke: MUTED, strokeWidth: 1 }}
          content={(props) => <Tip {...props} format={format} />}
        />
        {series.map((s) => (
          <Line
            key={s.key}
            type={step ? 'stepAfter' : 'monotone'}
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            connectNulls={false}
            dot={false}
            isAnimationActive={false}
            activeDot={{ r: 4, stroke: SURFACE, strokeWidth: 2 }}
          >
            {endLabels && (
              <LabelList content={endLabel(lastDefinedIndex(data, s.key), s.label)} />
            )}
          </Line>
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

/* ── stacked bars ─────────────────────────────────────────────────────────── */

export function StackedBarChart({
  data,
  series,
  format,
  height = 210,
  xKind = 'week',
  totalFormat,
}: {
  data: ChartRow[]
  series: SeriesSpec[]
  format: ValueFormat
  height?: number
  xKind?: 'day' | 'week'
  totalFormat?: ValueFormat
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} barCategoryGap="22%">
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis {...xAxisProps} />
        <YAxis {...yAxisProps} tickFormatter={FORMATTERS[format]} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'var(--color-surface-card-active)' }}
          content={(props) => (
            <Tip {...props} format={format} xKind={xKind} totalFormat={totalFormat} />
          )}
        />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stackId="a"
            fill={s.color}
            // 2px surface ring = the gap between stacked segments.
            stroke={SURFACE}
            strokeWidth={2}
            radius={i === series.length - 1 ? [3, 3, 0, 0] : undefined}
            maxBarSize={44}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ── 100% stacked area ────────────────────────────────────────────────────── */

export function PercentAreaChart({
  data,
  series,
  format,
  height = 210,
  xKind = 'week',
}: {
  data: ChartRow[]
  series: SeriesSpec[]
  format: ValueFormat
  height?: number
  xKind?: 'day' | 'week'
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        stackOffset="expand"
        margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
      >
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis {...xAxisProps} />
        <YAxis
          {...yAxisProps}
          domain={[0, 1]}
          ticks={[0, 0.25, 0.5, 0.75, 1]}
          tickFormatter={(v: number) => formatPercent(v * 100)}
        />
        <Tooltip
          cursor={{ stroke: MUTED, strokeWidth: 1 }}
          content={(props) => (
            <Tip {...props} format={format} xKind={xKind} totalFormat={format} />
          )}
        />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stackId="a"
            fill={s.color}
            fillOpacity={0.85}
            stroke={SURFACE}
            strokeWidth={2}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
