import { Fragment } from 'react'

export type BarDatum = {
  label: string
  // Stack of segments. Sum is the total bar height; segments stack from bottom.
  segments: { value: number; color: string; label?: string }[]
}

export function BarChart({
  data,
  yFormat = (v) => String(Math.round(v)),
  height = 180,
  ySteps = 4,
  legend,
}: {
  data: BarDatum[]
  yFormat?: (v: number) => string
  height?: number
  ySteps?: number
  legend?: { label: string; color: string }[]
}) {
  const totals = data.map((d) => d.segments.reduce((acc, s) => acc + s.value, 0))
  const max = Math.max(1, ...totals) * 1.15

  const padL = 40
  const padR = 12
  const padT = 12
  const padB = 28
  const vbW = 600
  const vbH = height

  const innerW = vbW - padL - padR
  const innerH = vbH - padT - padB

  const n = data.length
  const slot = n > 0 ? innerW / n : 0
  const barW = Math.min(36, slot * 0.6)

  const yPos = (v: number) => padT + innerH - (v / max) * innerH

  const yTicks = Array.from({ length: ySteps + 1 }, (_, i) => (max * i) / ySteps)

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

        {data.map((d, i) => {
          const cx = padL + slot * i + slot / 2
          let yCursor = yPos(0)
          return (
            <g key={i}>
              {d.segments.map((s, si) => {
                const h = (s.value / max) * innerH
                yCursor -= h
                return (
                  <rect
                    key={si}
                    x={cx - barW / 2}
                    y={yCursor}
                    width={barW}
                    height={h}
                    fill={s.color}
                    rx={2}
                  />
                )
              })}
              <text
                x={cx}
                y={vbH - 8}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="var(--color-text-tertiary)"
                className="uppercase tracking-wider"
              >
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>

      {legend && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 px-2">
          {legend.map((l) => (
            <div key={l.label} className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-text-secondary font-bold">
              <span className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
