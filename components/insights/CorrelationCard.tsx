import { formatDuration } from '@/lib/dates'
import { CHART } from '@/lib/chart'
import type { Correlation } from '@/lib/types'
import { ArrowDownIcon, ArrowUpIcon } from '@/components/ui/Icons'
import { StrengthBadge } from './StrengthBadge'

function Side({ label, avg, n, minutes, color }: { label: string; avg: number | null; n: number; minutes?: number | null; color: string }) {
  const pct = avg === null ? 0 : (avg / 5) * 100
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-[12px]">
        <span className="truncate text-muted">{label}</span>
        <span className="shrink-0 tabular-nums">
          <span className="font-bold text-text">{avg ?? '-'}</span>
          <span className="text-muted"> / 5 · {n} night{n === 1 ? '' : 's'}</span>
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-background/70">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      {minutes ? <p className="mt-1 text-[11px] tabular-nums text-muted">{formatDuration(minutes)} in bed on average</p> : null}
    </div>
  )
}

export function CorrelationCard({ c }: { c: Correlation }) {
  const worse = c.direction === 'worse'
  const better = c.direction === 'better'

  return (
    <article className="card animate-rise-in p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-[15px] font-semibold leading-snug">{c.factor}</h3>
        <StrengthBadge strength={c.correlation_strength} />
      </div>

      {(worse || better) && (
        <p className={`mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold ${worse ? 'text-poor' : 'text-good'}`}>
          {worse ? <ArrowDownIcon size={14} /> : <ArrowUpIcon size={14} />}
          Goes with {worse ? 'worse' : 'better'} sleep for you
        </p>
      )}

      <p className="mt-3 text-sm leading-relaxed text-text/90">{c.description}</p>

      <div className="mt-4 space-y-3">
        <Side label={c.with_label} avg={c.with_avg} n={c.with_n} minutes={c.with_duration} color={CHART.with} />
        <Side label={c.without_label} avg={c.without_avg} n={c.without_n} minutes={c.without_duration} color={CHART.without} />
      </div>
    </article>
  )
}
