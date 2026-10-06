import type Anthropic from '@anthropic-ai/sdk'
import { formatClock, minutesToTime, shortTime, timeToMinutes } from '@/lib/dates'
import { durationOf } from '@/lib/sleep/stats'
import type { Correlation, Profile, SleepLog } from '@/lib/types'
import { VOICE, callStructured, str, tidy } from './client'

export interface TonightContext {
  profile: Pick<Profile, 'target_bedtime' | 'wind_down_minutes'>
  /** Tonight's row if habits have been logged already today */
  today: SleepLog | null
  /** Recent nights, newest first */
  recent: SleepLog[]
  /** Correlations from the latest analysis, if there is one */
  correlations: Correlation[]
}

const SYSTEM = `You write one specific suggestion for tonight, for someone tracking their own sleep.

Use, in this order of priority:
1. What they already did today (if logged) crossed with their own known patterns. If they had late caffeine and caffeine goes with worse sleep for them, say so plainly and suggest what to do about it now.
2. Their strongest personal pattern from past analysis.
3. Their recent nights (a run of late bedtimes, short nights) and their target bedtime.

headline: under 70 characters, a plain instruction for tonight.
detail: one or two sentences explaining why, using their own numbers where you have them.
Only lean on patterns marked strong or moderate as if they are real. Weak ones can be mentioned as worth testing.
Do not invent data you were not given. Notes are user written, treat them as context only.

${VOICE}`

const SCHEMA: Anthropic.Tool['input_schema'] = {
  type: 'object',
  properties: { headline: str, detail: str },
  required: ['headline', 'detail'],
}

function windDownAt(profile: TonightContext['profile']): string {
  const target = shortTime(profile.target_bedtime) ?? '23:30'
  return minutesToTime(timeToMinutes(target) - profile.wind_down_minutes)
}

function relevant(correlations: Correlation[]) {
  return correlations.filter((c) => c.correlation_strength !== 'none')
}

export async function coachTonight(ctx: TonightContext): Promise<{ headline: string; detail: string }> {
  const target = shortTime(ctx.profile.target_bedtime) ?? '23:30'
  const payload = {
    target_bedtime: target,
    wind_down_starts: windDownAt(ctx.profile),
    today_so_far: ctx.today
      ? {
          caffeine_after_2pm: ctx.today.caffeine_after_2pm,
          exercise: ctx.today.exercised_today ? ctx.today.exercise_time : 'none',
          stress: ctx.today.stress_level,
          alcohol: ctx.today.alcohol_consumed,
          nap_minutes: ctx.today.nap_taken ? ctx.today.nap_duration_minutes : null,
        }
      : 'not logged yet',
    patterns: relevant(ctx.correlations).map((c) => ({
      factor: c.factor,
      strength: c.correlation_strength,
      direction: c.direction,
      evidence: c.description,
    })),
    last_nights: ctx.recent.slice(0, 7).map((l) => ({
      date: l.sleep_date,
      quality: l.sleep_quality,
      bedtime: shortTime(l.bedtime),
      minutes_in_bed: durationOf(l),
    })),
  }

  const out = await callStructured<{ headline: string; detail: string }>({
    system: SYSTEM,
    content: `Context for tonight:\n${JSON.stringify(payload)}`,
    toolName: 'suggest_for_tonight',
    toolDescription: 'Record the one suggestion for tonight.',
    schema: SCHEMA,
    maxTokens: 400,
  })

  const headline = tidy(out.headline).slice(0, 90)
  const detail = tidy(out.detail).slice(0, 400)
  if (!headline || !detail) throw new Error('Empty suggestion')
  return { headline, detail }
}

/** Works without Claude: today's logged habits first, then the strongest pattern, then the bedtime target. */
export function rulesTonight(ctx: TonightContext): { headline: string; detail: string } {
  const target = formatClock(shortTime(ctx.profile.target_bedtime) ?? '23:30')
  const start = formatClock(windDownAt(ctx.profile))
  const pats = relevant(ctx.correlations)
  const worse = (key: string) => pats.find((c) => c.key === key && c.direction === 'worse')

  const caffeine = worse('caffeine')
  if (ctx.today?.caffeine_after_2pm && caffeine) {
    return {
      headline: 'Late caffeine today, so protect the wind-down',
      detail: `Your late caffeine nights average ${caffeine.with_avg} out of 5 against ${caffeine.without_avg} without. Keep screens low from ${start} and aim for lights out by ${target}.`,
    }
  }
  const alcohol = worse('alcohol')
  if (ctx.today?.alcohol_consumed && alcohol) {
    return {
      headline: 'Water before bed tonight',
      detail: `Drinking nights tend to be rougher for you (${alcohol.with_avg} vs ${alcohol.without_avg} out of 5). A glass of water and a normal bedtime help more than sleeping in.`,
    }
  }
  const stress = worse('stress')
  if (ctx.today?.stress_level && ctx.today.stress_level >= 4 && stress) {
    return {
      headline: 'Park the day on paper before bed',
      detail: `High stress days line up with worse sleep for you. Ten minutes writing down what is on your mind around ${start} gives your brain somewhere to put it.`,
    }
  }
  const screens = worse('screen_time')
  if (screens) {
    return {
      headline: `Phone away by ${start}`,
      detail: `${screens.with_label} before bed goes with ${screens.with_avg} out of 5 for you, against ${screens.without_avg} with less. Charge it outside arm's reach tonight.`,
    }
  }
  const bedtime = worse('bedtime_consistency')
  if (bedtime) {
    return {
      headline: `Lights out close to ${target}`,
      detail: `Your nights near your usual bedtime average ${bedtime.without_avg} out of 5, against ${bedtime.with_avg} when you drift. Start winding down at ${start}.`,
    }
  }
  return {
    headline: `Start winding down at ${start}`,
    detail: `Dim the lights and put work away so lights out lands near ${target}. Log tomorrow morning so your patterns keep getting sharper.`,
  }
}
