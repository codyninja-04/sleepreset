export type ExerciseTime = 'morning' | 'afternoon' | 'evening' | 'none'
export type Strength = 'strong' | 'moderate' | 'weak' | 'none'
export type Plan = 'free' | 'pro'

export interface Profile {
  id: string
  display_name: string | null
  timezone: string
  plan: Plan
  /** 'HH:MM' or 'HH:MM:SS' as Postgres returns it */
  target_bedtime: string
  wind_down_minutes: number
  reminder_enabled: boolean
  last_reminded_on: string | null
}

/**
 * One night. sleep_date is the evening the night started, and the habit
 * columns describe that same day, so a row reads "what I did, then how I slept".
 */
export interface SleepLog {
  id: string
  user_id: string
  sleep_date: string
  bedtime: string | null
  wake_time: string | null
  sleep_quality: number | null
  times_woken: number | null
  caffeine_after_2pm: boolean
  screen_time_before_bed_minutes: number | null
  exercised_today: boolean
  exercise_time: ExerciseTime | null
  alcohol_consumed: boolean
  stress_level: number | null
  nap_taken: boolean
  nap_duration_minutes: number | null
  notes: string | null
  created_at?: string
  updated_at?: string
}

export type SleepLogInput = Omit<SleepLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>

/** Stored in sleep_insights.correlations. Numbers come from code, words from Claude. */
export interface Correlation {
  factor: string
  key: string
  correlation_strength: Strength
  description: string
  /** 'better' means the habit goes with better sleep, 'worse' with worse */
  direction: 'better' | 'worse' | 'flat'
  with_label: string
  without_label: string
  with_avg: number | null
  without_avg: number | null
  with_n: number
  without_n: number
  /** Average minutes in bed on each side, when times were logged */
  with_duration?: number | null
  without_duration?: number | null
}

export interface SleepInsight {
  id: string
  user_id: string
  generated_at: string
  based_on_days: number
  correlations: Correlation[]
  top_recommendation: string | null
  source: 'ai' | 'rules'
}

export interface TonightCoaching {
  for_date: string
  headline: string
  detail: string
  source: 'ai' | 'rules'
}
