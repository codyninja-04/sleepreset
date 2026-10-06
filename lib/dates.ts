/**
 * Dates are plain 'YYYY-MM-DD' strings in the user's own timezone and times
 * are 'HH:MM'. Date arithmetic happens at UTC noon so daylight saving never
 * shifts a day, and nothing here depends on the server's local clock.
 */

const DAY_MS = 86_400_000

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

function safeTz(tz: string | null | undefined): string {
  return tz && isValidTimezone(tz) ? tz : 'Asia/Singapore'
}

/** The calendar date of an instant, as seen in a timezone. */
export function dateInTz(instant: Date | string, tz: string): string {
  const d = typeof instant === 'string' ? new Date(instant) : instant
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTz(tz),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function todayIn(tz: string): string {
  return dateInTz(new Date(), tz)
}

/** Minutes since local midnight in a timezone, 0 to 1439. */
export function minutesIn(tz: string, now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz(tz),
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now)
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return h * 60 + m
}

/**
 * The night someone most likely wants to log right now. In the morning and
 * early afternoon that is last night. From late afternoon it is tonight,
 * so habits can be filled in before bed and the sleep part finished tomorrow.
 */
export function defaultNight(tz: string): string {
  const today = todayIn(tz)
  return minutesIn(tz) < 16 * 60 ? addDays(today, -1) : today
}

function toUtcNoon(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d, 12)
}

export function addDays(date: string, n: number): string {
  return new Date(toUtcNoon(date) + n * DAY_MS).toISOString().slice(0, 10)
}

export function diffDays(later: string, earlier: string): number {
  return Math.round((toUtcNoon(later) - toUtcNoon(earlier)) / DAY_MS)
}

export function isDateString(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(toUtcNoon(v))
}

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }): string {
  return new Intl.DateTimeFormat('en-SG', { ...opts, timeZone: 'UTC' }).format(new Date(toUtcNoon(date)))
}

export function weekdayShort(date: string): string {
  return formatDate(date, { weekday: 'short' })
}

/** "Last night", "Tonight" or "Mon 5 Oct" for the night that started on this date. */
export function nightLabel(date: string, today: string): string {
  const d = diffDays(today, date)
  if (d === 0) return 'Tonight'
  if (d === 1) return 'Last night'
  return formatDate(date, { weekday: 'short', day: 'numeric', month: 'short' })
}

// ---------------------------------------------------------------------------
// Clock times
// ---------------------------------------------------------------------------

export function isTimeString(v: unknown): v is string {
  return typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(v)
}

/** Postgres returns 'HH:MM:SS'. Inputs and labels want 'HH:MM'. */
export function shortTime(t: string | null | undefined): string | null {
  return t && isTimeString(t) ? t.slice(0, 5) : null
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/**
 * Bedtimes wrap past midnight, so 23:30 and 00:30 are an hour apart, not 23.
 * Shifting the clock to start at 6pm puts every realistic bedtime on one line.
 */
export function bedtimeOffset(t: string): number {
  return (timeToMinutes(t) - 18 * 60 + 1440) % 1440
}

export function offsetToTime(offset: number): string {
  return minutesToTime(offset + 18 * 60)
}

/** Minutes asleep window between bedtime and wake time, crossing midnight if needed. */
export function sleepMinutes(bedtime: string | null, wake: string | null): number | null {
  if (!bedtime || !wake || !isTimeString(bedtime) || !isTimeString(wake)) return null
  let diff = timeToMinutes(wake) - timeToMinutes(bedtime)
  if (diff <= 0) diff += 1440
  return diff
}

export function formatDuration(min: number | null | undefined): string {
  if (min == null) return '-'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (!h) return `${m}m`
  return m ? `${h}h ${m}m` : `${h}h`
}

/** '23:30' to '11:30pm' */
export function formatClock(t: string | null | undefined): string {
  const s = shortTime(t)
  if (!s) return '-'
  const [h, m] = s.split(':').map(Number)
  const suffix = h < 12 ? 'am' : 'pm'
  const twelve = h % 12 === 0 ? 12 : h % 12
  return m ? `${twelve}:${String(m).padStart(2, '0')}${suffix}` : `${twelve}${suffix}`
}
