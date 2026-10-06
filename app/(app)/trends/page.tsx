import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SleepQualityChart, type TrendPoint } from '@/components/trends/SleepQualityChart'
import { LockIcon } from '@/components/ui/Icons'
import { addDays, bedtimeOffset, diffDays, formatClock, formatDate, formatDuration, offsetToTime, shortTime, todayIn } from '@/lib/dates'
import { FREE_HISTORY_DAYS, hasPro } from '@/lib/plan'
import { isComplete, loadLogs, loadProfile } from '@/lib/sleep/load'
import { durationOf, mean, median, round } from '@/lib/sleep/stats'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Trends' }

const RANGES = [
  { value: '14', label: '2 weeks', days: 14 },
  { value: '30', label: '30 days', days: 30 },
  { value: '90', label: '90 days', days: 90 },
  { value: 'all', label: 'All', days: null },
] as const

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <p className="eyebrow">{label}</p>
      <p className="stat mt-1.5">{value}</p>
      {sub && <p className="mt-0.5 text-[12px] text-muted">{sub}</p>}
    </div>
  )
}

export default async function TrendsPage({ searchParams }: { searchParams: { range?: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await loadProfile(supabase, user.id)
  const pro = hasPro(profile)
  const today = todayIn(profile.timezone)

  const requested = RANGES.find((r) => r.value === searchParams.range) ?? RANGES[1]
  const locked = (r: (typeof RANGES)[number]) => !pro && (r.days === null || r.days > FREE_HISTORY_DAYS)
  const range = locked(requested) ? RANGES[1] : requested

  const since = range.days ? addDays(today, -(range.days - 1)) : undefined
  const logs = await loadLogs(supabase, user.id, { since, limit: 1000 })
  const rated = logs.filter(isComplete)

  // Every night in the range gets a slot, so gaps show as gaps rather than squashing the line.
  const oldest = logs.length ? logs[logs.length - 1].sleep_date : today
  const start = since ?? oldest
  const span = Math.max(1, diffDays(today, start) + 1)
  const byDate = new Map(logs.map((l) => [l.sleep_date, l]))
  const points: TrendPoint[] = []
  for (let i = 0; i < span; i++) {
    const date = addDays(start, i)
    const log = byDate.get(date)
    const window = Array.from({ length: 7 }, (_, k) => byDate.get(addDays(date, -k))?.sleep_quality).filter(
      (q): q is number => typeof q === 'number'
    )
    const dur = log ? durationOf(log) : null
    const bed = shortTime(log?.bedtime)
    points.push({
      date,
      label: formatDate(date),
      quality: log?.sleep_quality ?? null,
      rolling: window.length >= 3 ? round(mean(window), 2) : null,
      hours: dur === null ? null : round(dur / 60, 2),
      bed_offset: bed ? bedtimeOffset(bed) : null,
    })
  }

  const durations = logs.map(durationOf).filter((d): d is number => d !== null)
  const offsets = logs.map((l) => shortTime(l.bedtime)).filter((t): t is string => Boolean(t)).map(bedtimeOffset)
  const usual = median(offsets)
  const spread = usual === null ? null : median(offsets.map((o) => Math.abs(o - usual)))
  const avgQ = round(mean(rated.map((l) => l.sleep_quality as number)))
  const target = shortTime(profile.target_bedtime)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trends</h1>
          <p className="mt-1 text-sm text-muted">
            {logs.length} night{logs.length === 1 ? '' : 's'} logged in this range
          </p>
        </div>
        <nav className="flex gap-1 rounded-xl border border-border bg-surface/60 p-1" aria-label="Range">
          {RANGES.map((r) => {
            const isLocked = locked(r)
            const active = r.value === range.value
            return isLocked ? (
              <span
                key={r.value}
                title="Full history is part of Pro"
                className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-muted/60"
              >
                <LockIcon size={12} />
                {r.label}
              </span>
            ) : (
              <Link
                key={r.value}
                href={`/trends?range=${r.value}`}
                aria-current={active ? 'page' : undefined}
                className={`rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition ${
                  active ? 'bg-primary text-white' : 'text-muted hover:text-text'
                }`}
              >
                {r.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {logs.length === 0 ? (
        <section className="card p-6 text-center">
          <h2 className="text-lg font-bold">No nights in this range yet</h2>
          <p className="mt-1.5 text-sm text-muted">Log a few nights and your trends will show up here.</p>
          <Link href="/log" className="btn-primary mt-5">
            Log a night
          </Link>
        </section>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Tile label="Avg quality" value={avgQ === null ? '-' : `${avgQ}`} sub={`out of 5, ${rated.length} rated`} />
            <Tile label="Avg in bed" value={formatDuration(round(mean(durations), 0))} sub={`${durations.length} nights with times`} />
            <Tile label="Usual lights out" value={usual === null ? '-' : formatClock(offsetToTime(Math.round(usual)))} sub="median bedtime" />
            <Tile
              label="Bedtime drift"
              value={spread === null ? '-' : `±${formatDuration(Math.round(spread))}`}
              sub="typical gap from usual"
            />
          </div>

          <SleepQualityChart points={points} targetOffset={target ? bedtimeOffset(target) : null} />

          <details className="card p-5">
            <summary className="cursor-pointer text-sm font-semibold">Table view</summary>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-[13px] tabular-nums">
                <thead className="text-muted">
                  <tr>
                    <th className="py-2 font-semibold">Night</th>
                    <th className="py-2 font-semibold">Quality</th>
                    <th className="py-2 font-semibold">Lights out</th>
                    <th className="py-2 font-semibold">Woke</th>
                    <th className="py-2 font-semibold">In bed</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-t border-border/60">
                      <td className="py-2">
                        <Link href={`/log?date=${l.sleep_date}`} className="hover:underline">
                          {formatDate(l.sleep_date, { weekday: 'short', day: 'numeric', month: 'short' })}
                        </Link>
                      </td>
                      <td className="py-2">{l.sleep_quality ?? '-'}</td>
                      <td className="py-2">{formatClock(l.bedtime)}</td>
                      <td className="py-2">{formatClock(l.wake_time)}</td>
                      <td className="py-2">{formatDuration(durationOf(l))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </div>
  )
}
