import { bedtimeOffset, offsetToTime, shortTime, sleepMinutes, timeToMinutes, minutesToTime } from '@/lib/dates'
import type { SleepLog } from '@/lib/types'

export function mean(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

export function round(n: number | null, dp = 1): number | null {
  if (n === null || !Number.isFinite(n)) return null
  const f = 10 ** dp
  return Math.round(n * f) / f
}

/** Usual bedtime and wake time from recent nights, used to prefill the form. */
export function typicalTimes(logs: SleepLog[]): { bedtime: string | null; wake: string | null } {
  const recent = logs.slice(0, 14)
  const beds = recent.map((l) => shortTime(l.bedtime)).filter((t): t is string => Boolean(t))
  const wakes = recent.map((l) => shortTime(l.wake_time)).filter((t): t is string => Boolean(t))
  const bed = median(beds.map(bedtimeOffset))
  const wake = median(wakes.map(timeToMinutes))
  // Round to 5 minutes so the prefill looks like a guess, not a measurement.
  return {
    bedtime: bed === null ? null : offsetToTime(Math.round(bed / 5) * 5),
    wake: wake === null ? null : minutesToTime(Math.round(wake / 5) * 5),
  }
}

export function durationOf(log: SleepLog): number | null {
  return sleepMinutes(shortTime(log.bedtime), shortTime(log.wake_time))
}
