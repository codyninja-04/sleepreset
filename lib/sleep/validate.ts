import { cleanText } from '@/lib/api'
import { isDateString, isTimeString } from '@/lib/dates'
import type { ExerciseTime, SleepLogInput } from '@/lib/types'

const EXERCISE_TIMES: ExerciseTime[] = ['morning', 'afternoon', 'evening']

function intIn(v: unknown, min: number, max: number): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return Math.min(max, Math.max(min, Math.round(n)))
}

/**
 * Turns a request body into a row we are happy to store. Anything missing is
 * left empty rather than guessed, because a guessed value would quietly skew
 * the correlations later.
 */
export function parseSleepLog(
  body: Record<string, unknown>,
  today: string
): { ok: true; value: SleepLogInput } | { ok: false; error: string } {
  const date = body.sleep_date
  if (!isDateString(date)) return { ok: false, error: 'Pick which night this is for' }
  if (date > today) return { ok: false, error: 'That night has not happened yet' }

  const bedtime = body.bedtime ? String(body.bedtime) : null
  const wake = body.wake_time ? String(body.wake_time) : null
  if (bedtime && !isTimeString(bedtime)) return { ok: false, error: 'Bedtime should look like 23:30' }
  if (wake && !isTimeString(wake)) return { ok: false, error: 'Wake time should look like 07:00' }

  const exercised = body.exercised_today === true
  const rawTime = body.exercise_time as ExerciseTime
  const napped = body.nap_taken === true

  return {
    ok: true,
    value: {
      sleep_date: date,
      bedtime: bedtime ? bedtime.slice(0, 5) : null,
      wake_time: wake ? wake.slice(0, 5) : null,
      sleep_quality: intIn(body.sleep_quality, 1, 5),
      times_woken: intIn(body.times_woken, 0, 30) ?? 0,
      caffeine_after_2pm: body.caffeine_after_2pm === true,
      screen_time_before_bed_minutes: intIn(body.screen_time_before_bed_minutes, 0, 720),
      exercised_today: exercised,
      exercise_time: exercised ? (EXERCISE_TIMES.includes(rawTime) ? rawTime : null) : 'none',
      alcohol_consumed: body.alcohol_consumed === true,
      stress_level: intIn(body.stress_level, 1, 5),
      nap_taken: napped,
      nap_duration_minutes: napped ? intIn(body.nap_duration_minutes, 0, 300) : null,
      notes: cleanText(body.notes, 500),
    },
  }
}
