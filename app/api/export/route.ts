import { requireUser } from '@/lib/api'
import { shortTime } from '@/lib/dates'
import { durationOf } from '@/lib/sleep/stats'
import type { SleepLog } from '@/lib/types'

const COLUMNS: Array<[string, (l: SleepLog) => unknown]> = [
  ['night_of', (l) => l.sleep_date],
  ['bedtime', (l) => shortTime(l.bedtime)],
  ['wake_time', (l) => shortTime(l.wake_time)],
  ['minutes_in_bed', (l) => durationOf(l)],
  ['sleep_quality', (l) => l.sleep_quality],
  ['times_woken', (l) => l.times_woken],
  ['caffeine_after_2pm', (l) => l.caffeine_after_2pm],
  ['screen_minutes_before_bed', (l) => l.screen_time_before_bed_minutes],
  ['exercised', (l) => l.exercised_today],
  ['exercise_time', (l) => l.exercise_time],
  ['alcohol', (l) => l.alcohol_consumed],
  ['stress_level', (l) => l.stress_level],
  ['nap_taken', (l) => l.nap_taken],
  ['nap_minutes', (l) => l.nap_duration_minutes],
  ['notes', (l) => l.notes],
]

function cell(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  // Quote anything with a comma, quote or newline, and defuse spreadsheet formulas.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/** Every logged night as a CSV, oldest first. */
export async function GET() {
  const auth = await requireUser()
  if (auth.error) return auth.error
  const { supabase, user } = auth

  const { data } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('sleep_date', { ascending: true })
    .limit(5000)

  const rows = ((data ?? []) as SleepLog[]).map((l) => COLUMNS.map(([, get]) => cell(get(l))).join(','))
  const csv = [COLUMNS.map(([name]) => name).join(','), ...rows].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sleepreset-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
