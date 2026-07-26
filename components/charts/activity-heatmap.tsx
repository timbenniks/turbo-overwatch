import { weekStart } from '@/lib/rolling'
import { formatDayLabel } from '@/lib/format'

const HEAT = [
  'var(--color-heat-0)',
  'var(--color-heat-1)',
  'var(--color-heat-2)',
  'var(--color-heat-3)',
  'var(--color-heat-4)',
]

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// 0 = no games; 1–4 = quartiles of the busiest day in range. A fixed absolute
// scale would flatten to one step for most players, so the ramp is relative and
// the legend says so.
function level(games: number, max: number): number {
  if (games <= 0) return 0
  if (max <= 1) return 4
  return Math.min(4, 1 + Math.floor(((games - 1) / max) * 3.999))
}

export function ActivityHeatmap({
  days,
}: {
  days: { date: string; games_played: number }[]
}) {
  if (days.length === 0) return null

  const byDate = new Map(days.map((d) => [d.date, d.games_played]))
  const first = days[0].date
  const last = days[days.length - 1].date
  const max = Math.max(...days.map((d) => d.games_played))

  const weeks: { week: string; cells: { date: string; games: number | null }[] }[] = []
  for (let w = weekStart(first); w <= last; w = addDays(w, 7)) {
    weeks.push({
      week: w,
      cells: Array.from({ length: 7 }, (_, i) => {
        const date = addDays(w, i)
        if (date < first || date > last) return { date, games: null }
        return { date, games: byDate.get(date) ?? 0 }
      }),
    })
  }

  // A column is 15px including the gap and a month name is ~26px, so two
  // columns of clearance is the minimum that doesn't collide.
  const monthLabels: (string | null)[] = []
  let lastLabelled = -99
  weeks.forEach((w, i) => {
    const month = Number(w.week.slice(5, 7))
    const prevMonth = i > 0 ? Number(weeks[i - 1].week.slice(5, 7)) : null
    if ((i === 0 || month !== prevMonth) && i - lastLabelled >= 2) {
      monthLabels.push(MONTHS[month - 1])
      lastLabelled = i
    } else {
      monthLabels.push(null)
    }
  })

  const activeDays = days.filter((d) => d.games_played > 0).length

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-1 min-w-full">
          {/* month ruler */}
          <div className="flex gap-[3px] pl-5">
            {weeks.map((w, i) => (
              <div key={w.week} className="w-3 shrink-0 relative h-3">
                {monthLabels[i] && (
                  <span className="absolute left-0 top-0 text-[9px] uppercase tracking-[0.15em] text-text-tertiary font-bold whitespace-nowrap">
                    {monthLabels[i]}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {/* weekday ruler — Mon/Wed/Fri only, the rest would collide */}
            <div className="grid grid-rows-7 gap-[3px] w-5 shrink-0">
              {WEEKDAYS.map((d, i) => (
                <span
                  key={i}
                  className="h-3 text-[9px] leading-3 uppercase text-text-tertiary font-bold"
                >
                  {i % 2 === 0 ? d : ''}
                </span>
              ))}
            </div>

            {weeks.map((w) => (
              <div key={w.week} className="grid grid-rows-7 gap-[3px] shrink-0">
                {w.cells.map((c) =>
                  c.games === null ? (
                    <span key={c.date} className="w-3 h-3" />
                  ) : (
                    <span
                      key={c.date}
                      className="w-3 h-3 rounded-[3px]"
                      style={{ background: HEAT[level(c.games, max)] }}
                      title={`${formatDayLabel(c.date)} — ${c.games} game${c.games === 1 ? '' : 's'}`}
                    />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <span className="text-[10px] uppercase tracking-widest text-text-tertiary font-bold">
          {activeDays} of {days.length} days played
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-[9px] uppercase tracking-widest text-text-tertiary font-bold mr-1">
            0
          </span>
          {HEAT.map((c) => (
            <span key={c} className="w-3 h-3 rounded-[3px]" style={{ background: c }} />
          ))}
          <span className="text-[9px] uppercase tracking-widest text-text-tertiary font-bold ml-1">
            {max}
          </span>
        </div>
      </div>
    </div>
  )
}
