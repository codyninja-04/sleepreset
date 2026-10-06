import { bedtimeOffset, formatDuration, shortTime } from '@/lib/dates'
import type { SleepLog, Strength } from '@/lib/types'
import { durationOf, mean, median, round } from './stats'
import { isComplete } from './load'

/** Nights with a quality rating needed before any pattern is shown. */
export const MIN_NIGHTS = 10
/** Below this many nights in either group, a comparison says nothing. */
const MIN_GROUP = 3

export const STRENGTH_RANK: Record<Strength, number> = { strong: 3, moderate: 2, weak: 1, none: 0 }

export interface FactorStat {
  key: string
  factor: string
  with_label: string
  without_label: string
  with_avg: number | null
  without_avg: number | null
  with_n: number
  without_n: number
  with_duration: number | null
  without_duration: number | null
  /** with_avg minus without_avg, on the 1 to 5 quality scale */
  delta: number | null
  /** The most the numbers can support. Claude may lower this, never raise it. */
  max_strength: Strength
  direction: 'better' | 'worse' | 'flat'
}

type Group = (log: SleepLog) => boolean | null

function sd(xs: number[]): number {
  const m = mean(xs)
  if (m === null || xs.length < 2) return 0
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1))
}

/**
 * Strength from the size of the gap, how many nights back each side, and how
 * noisy the ratings are. Deliberately conservative: a one star gap across
 * three nights is a hunch, not a finding.
 */
function strengthOf(withQ: number[], withoutQ: number[]): Strength {
  const minGroup = Math.min(withQ.length, withoutQ.length)
  if (minGroup < MIN_GROUP) return 'none'
  const delta = Math.abs((mean(withQ) ?? 0) - (mean(withoutQ) ?? 0))
  const pooled = Math.sqrt((sd(withQ) ** 2 + sd(withoutQ) ** 2) / 2) || 0.75
  const effect = delta / pooled
  const total = withQ.length + withoutQ.length

  if (delta >= 0.8 && effect >= 0.8 && minGroup >= 5 && total >= 14) return 'strong'
  if (delta >= 0.5 && effect >= 0.5 && minGroup >= 4) return 'moderate'
  if (delta >= 0.25) return 'weak'
  return 'none'
}

function compare(
  logs: SleepLog[],
  meta: { key: string; factor: string; with_label: string; without_label: string },
  group: Group
): FactorStat {
  const withLogs: SleepLog[] = []
  const withoutLogs: SleepLog[] = []
  for (const l of logs) {
    const g = group(l)
    if (g === true) withLogs.push(l)
    else if (g === false) withoutLogs.push(l)
  }
  const q = (ls: SleepLog[]) => ls.map((l) => l.sleep_quality as number)
  const d = (ls: SleepLog[]) => ls.map(durationOf).filter((x): x is number => x !== null)

  const withAvg = mean(q(withLogs))
  const withoutAvg = mean(q(withoutLogs))
  const delta = withAvg !== null && withoutAvg !== null ? withAvg - withoutAvg : null
  const max_strength = strengthOf(q(withLogs), q(withoutLogs))

  return {
    ...meta,
    with_avg: round(withAvg),
    without_avg: round(withoutAvg),
    with_n: withLogs.length,
    without_n: withoutLogs.length,
    with_duration: round(mean(d(withLogs)), 0),
    without_duration: round(mean(d(withoutLogs)), 0),
    delta: round(delta, 2),
    max_strength,
    direction: max_strength === 'none' || delta === null ? 'flat' : delta > 0 ? 'better' : 'worse',
  }
}

/**
 * Trying several cut offs makes it easy to find a gap by chance, so a split
 * only wins if it is both wide and backed by a decent number of nights.
 */
function splitScore(f: FactorStat): number {
  return Math.abs(f.delta ?? 0) * Math.sqrt(Math.min(f.with_n, f.without_n))
}

/** Tries a few cut offs and keeps the one that splits the nights most clearly. */
function screenTimeFactor(logs: SleepLog[]): FactorStat {
  const known = logs.filter((l) => l.screen_time_before_bed_minutes !== null)
  let best: FactorStat | null = null
  for (const t of [30, 60, 90, 120]) {
    const stat = compare(
      known,
      {
        key: 'screen_time',
        factor: `Screens over ${formatDuration(t)} before bed`,
        with_label: `Over ${formatDuration(t)}`,
        without_label: `${formatDuration(t)} or less`,
      },
      (l) => (l.screen_time_before_bed_minutes as number) > t
    )
    if (Math.min(stat.with_n, stat.without_n) < MIN_GROUP) continue
    if (!best || splitScore(stat) > splitScore(best)) best = stat
  }
  return (
    best ??
    compare(
      known,
      { key: 'screen_time', factor: 'Screens over 1h before bed', with_label: 'Over 1h', without_label: '1h or less' },
      (l) => (l.screen_time_before_bed_minutes as number) > 60
    )
  )
}

/** Nights more than 45 minutes off the usual bedtime versus nights close to it. */
function bedtimeFactor(logs: SleepLog[]): FactorStat {
  const offsets = logs.map((l) => shortTime(l.bedtime)).filter((t): t is string => Boolean(t)).map(bedtimeOffset)
  const usual = median(offsets)
  return compare(
    logs,
    {
      key: 'bedtime_consistency',
      factor: 'Bedtime off your usual by 45m or more',
      with_label: 'Irregular bedtime',
      without_label: 'Usual bedtime',
    },
    (l) => {
      const t = shortTime(l.bedtime)
      if (!t || usual === null) return null
      return Math.abs(bedtimeOffset(t) - usual) >= 45
    }
  )
}

/**
 * Every factor we look at, computed straight from the logs. Only nights with
 * a quality rating count. Ordered strongest first.
 */
export function computeFactors(allLogs: SleepLog[]): FactorStat[] {
  const logs = allLogs.filter(isComplete)

  const factors = [
    compare(
      logs,
      { key: 'caffeine', factor: 'Caffeine after 2pm', with_label: 'Caffeine after 2pm', without_label: 'No late caffeine' },
      (l) => l.caffeine_after_2pm
    ),
    screenTimeFactor(logs),
    compare(
      logs,
      { key: 'exercise', factor: 'Exercising that day', with_label: 'Exercised', without_label: 'Rest day' },
      (l) => l.exercised_today
    ),
    compare(
      logs,
      {
        key: 'evening_exercise',
        factor: 'Exercising in the evening',
        with_label: 'Evening workout',
        without_label: 'Earlier workout',
      },
      (l) => {
        if (!l.exercised_today || !l.exercise_time || l.exercise_time === 'none') return null
        return l.exercise_time === 'evening'
      }
    ),
    compare(
      logs,
      { key: 'stress', factor: 'High stress days', with_label: 'Stress 4 or 5', without_label: 'Stress 1 or 2' },
      (l) => (l.stress_level === null || l.stress_level === 3 ? null : l.stress_level >= 4)
    ),
    compare(
      logs,
      { key: 'alcohol', factor: 'Alcohol in the evening', with_label: 'Had a drink', without_label: 'No alcohol' },
      (l) => l.alcohol_consumed
    ),
    compare(
      logs,
      { key: 'nap', factor: 'Napping during the day', with_label: 'Napped', without_label: 'No nap' },
      (l) => l.nap_taken
    ),
    bedtimeFactor(logs),
  ]

  return factors.sort(
    (a, b) =>
      STRENGTH_RANK[b.max_strength] - STRENGTH_RANK[a.max_strength] || Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0)
  )
}

export function completeCount(logs: SleepLog[]): number {
  return logs.filter(isComplete).length
}

/** Plain evidence sentence, used when Claude is unavailable and as context for it. */
export function evidenceFor(f: FactorStat): string {
  if (Math.min(f.with_n, f.without_n) < MIN_GROUP) {
    const short = f.with_n < f.without_n ? f.with_label : f.without_label
    const n = Math.min(f.with_n, f.without_n)
    return `Not enough nights to compare yet. Only ${n} logged as "${short.toLowerCase()}", ${MIN_GROUP} needed on each side.`
  }
  const base = `${f.with_label}: ${f.with_avg} out of 5 across ${f.with_n} nights. ${f.without_label}: ${f.without_avg} across ${f.without_n} nights.`
  if (f.direction === 'flat') return `${base} No real difference so far.`
  return base
}
