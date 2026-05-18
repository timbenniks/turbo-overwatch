import { Fragment } from 'react'

export type LineSeries = {
  label: string
  color: string
  points: { x: number; y: number | null }[]
}

export function LineChart({
  series,
  xLabels,
  yMin,
  yMax,
  yFormat = (v) => String(Math.round(v)),
  height = 180,
  ySteps = 4,
}: {
  series: LineSeries[]
  xLabels: string[]
  yMin?: number
  yMax?: number
  yFormat?: (v: number) => string
  height?: number
  ySteps?: number
}) {
  const allYs = series.flatMap((s) => s.points.map((p) => p.y).filter((v): v is number => v !== null))
  const dataMin = allYs.length ? Math.min(...allYs) : 0
  const dataMax = allYs.length ? Math.max(...allYs) : 1
  const min = yMin ?? Math.max(0, dataMin - (dataMax - dataMin) * 0.15)
  const max = yMax ?? (dataMax + (dataMax - dataMin) * 0.15 || 1)
  const range = max - min || 1

  const padL = 40
  const padR = 12
  const padT = 12
  const padB = 28
  const vbW = 600
  const vbH = height

  const innerW = vbW - padL - padR
  const innerH = vbH - padT - padB

  const xCount = xLabels.length
  const xStep = xCount > 1 ? innerW / (xCount - 1) : 0

  const xPos = (i: number) => padL + xStep * i
  const yPos = (v: number) => padT + innerH - ((v - min) / range) * innerH

  const yTicks = Array.from({ length: ySteps + 1 }, (_, i) => min + (range * i) / ySteps)

  const isSingle = xCount < 2

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${vbW} ${vbH}`} className="w-full h-auto" preserveAspectRatio="none">
        {yTicks.map((v, i) => (
          <Fragment key={i}>
            <line
              x1={padL}
              x2={vbW - padR}
              y1={yPos(v)}
              y2={yPos(v)}
              stroke="var(--color-border-default)"
              strokeWidth={1}
              strokeDasharray={i === 0 ? '0' : '3 4'}
            />
            <text
              x={padL - 6}
              y={yPos(v)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fontWeight="700"
              fill="var(--color-text-tertiary)"
              className="uppercase tracking-wider"
            >
              {yFormat(v)}
            </text>
          </Fragment>
        ))}

        {series.map((s, si) => {
          const valid = s.points.filter((p) => p.y !== null) as { x: number; y: number }[]
          if (valid.length === 0) return null
          const d = valid
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(p.x)} ${yPos(p.y)}`)
            .join(' ')
          return (
            <g key={si}>
              {!isSingle && (
                <path d={d} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              )}
              {valid.map((p, i) => (
                <circle
                  key={i}
                  cx={xPos(p.x)}
                  cy={yPos(p.y)}
                  r={isSingle ? 5 : 3.5}
                  fill={s.color}
                />
              ))}
            </g>
          )
        })}

        {xLabels.map((lbl, i) => {
          const show = xCount <= 8 || i === 0 || i === xCount - 1 || i % Math.ceil(xCount / 6) === 0
          if (!show) return null
          return (
            <text
              key={i}
              x={xPos(i)}
              y={vbH - 8}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="var(--color-text-tertiary)"
              className="uppercase tracking-wider"
            >
              {lbl}
            </text>
          )
        })}
      </svg>

      {series.length > 1 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 px-2">
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-text-secondary font-bold">
              <span className="w-3 h-[3px] rounded-full" style={{ background: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
