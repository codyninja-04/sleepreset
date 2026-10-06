import Link from 'next/link'
import { addDays, formatDate, nightLabel } from '@/lib/dates'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/Icons'

/** Steps between nights. Never forward past tonight. */
export function NightPicker({ date, today }: { date: string; today: string }) {
  const prev = addDays(date, -1)
  const next = addDays(date, 1)
  const canNext = next <= today

  return (
    <div className="flex items-center justify-between gap-3">
      <Link href={`/log?date=${prev}`} className="btn-ghost h-10 w-10 p-0" aria-label="Previous night">
        <ChevronLeftIcon />
      </Link>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">{nightLabel(date, today)}</h1>
        <p className="text-[13px] text-muted">
          Night of {formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>
      {canNext ? (
        <Link href={`/log?date=${next}`} className="btn-ghost h-10 w-10 p-0" aria-label="Next night">
          <ChevronRightIcon />
        </Link>
      ) : (
        <span className="h-10 w-10" aria-hidden="true" />
      )}
    </div>
  )
}
