import Link from 'next/link'
import { addDays, formatDuration, nightLabel, weekdayShort } from '@/lib/dates'
import { durationOf } from '@/lib/sleep/stats'
import type { SleepLog } from '@/lib/types'
import { QUALITY_WORDS } from './StarRating'

const QUALITY_TONE = ['', 'bg-poor', 'bg-poor/70', 'bg-moderate', 'bg-good/70', 'bg-good']

/**
 * The last seven nights as a strip, so gaps and half finished logs are easy
 * to spot and one tap away from being fixed.
 */
export function RecentNights({ logs, today, selected }: { logs: SleepLog[]; today: string; selected: string }) {
  const byDate = new Map(logs.map((l) => [l.sleep_date, l]))
  const nights = Array.from({ length: 7 }, (_, i) => addDays(today, -i)).reverse()

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="text-sm font-semibold">Past week</h2>
        <span className="text-[12px] text-muted">Tap a night to edit it</span>
      </div>
      <ol className="grid grid-cols-7 gap-1.5">
        {nights.map((d) => {
          const log = byDate.get(d)
          const q = log?.sleep_quality ?? null
          const dur = log ? durationOf(log) : null
          const label = log
            ? q
              ? `${nightLabel(d, today)}: ${QUALITY_WORDS[q]}, ${formatDuration(dur)}`
              : `${nightLabel(d, today)}: sleep details missing`
            : `${nightLabel(d, today)}: not logged`
          return (
            <li key={d}>
              <Link
                href={`/log?date=${d}`}
                aria-label={label}
                aria-current={d === selected ? 'date' : undefined}
                className={`flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 transition ${
                  d === selected ? 'border-primary/70 bg-primary/10' : 'border-transparent hover:bg-subtle/60'
                }`}
              >
                <span className="text-[11px] font-semibold text-muted">{weekdayShort(d)}</span>
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-[12px] font-bold ${
                    q ? `${QUALITY_TONE[q]} text-background` : log ? 'border border-dashed border-moderate text-moderate' : 'border border-dashed border-border text-muted/60'
                  }`}
                >
                  {q ?? (log ? '?' : '')}
                </span>
                <span className="text-[10px] tabular-nums text-muted">{dur ? formatDuration(dur).replace(/ \d+m$/, '') : ' '}</span>
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
