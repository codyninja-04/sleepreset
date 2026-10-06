import Link from 'next/link'
import { MIN_NIGHTS } from '@/lib/sleep/correlations'

const CHECKS = [
  'Caffeine after 2pm',
  'Screens before bed',
  'Exercise and when you did it',
  'Stress levels',
  'Alcohol',
  'Naps',
  'How regular your bedtime is',
]

/** Shown until there are enough rated nights for a comparison to mean anything. */
export function UnlockProgress({ count }: { count: number }) {
  const left = Math.max(0, MIN_NIGHTS - count)
  const pct = Math.min(100, (count / MIN_NIGHTS) * 100)

  return (
    <section className="card overflow-hidden p-6 sm:p-7">
      <p className="eyebrow">Pattern insights</p>
      <h2 className="mt-2 text-xl font-bold tracking-tight">
        Log {left} more night{left === 1 ? '' : 's'} to unlock pattern insights
      </h2>
      <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted">
        With fewer than {MIN_NIGHTS} rated nights, any pattern would mostly be noise. Keep logging the way you normally
        live, and the comparisons will start to mean something.
      </p>

      <div className="mt-5">
        <div className="flex justify-between text-[12px] font-semibold tabular-nums text-muted">
          <span>
            {count} of {MIN_NIGHTS} nights
          </span>
          <span>{Math.round(pct)}%</span>
        </div>
        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-background/70">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-6 border-t border-border/70 pt-5">
        <p className="text-[13px] font-semibold">What we will check against your sleep</p>
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {CHECKS.map((c) => (
            <li key={c} className="chip cursor-default">
              {c}
            </li>
          ))}
        </ul>
      </div>

      <Link href="/log" className="btn-primary mt-6">
        Log a night
      </Link>
    </section>
  )
}
