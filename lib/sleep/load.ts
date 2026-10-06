import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile, SleepInsight, SleepLog } from '@/lib/types'

const DEFAULT_PROFILE: Omit<Profile, 'id'> = {
  display_name: null,
  timezone: 'Asia/Singapore',
  plan: 'free',
  target_bedtime: '23:30',
  wind_down_minutes: 45,
  reminder_enabled: false,
  last_reminded_on: null,
}

/**
 * The sign up trigger normally creates the profile. If it is missing (an
 * account that existed before the trigger) we create it here instead of
 * failing every page.
 */
export async function loadProfile(supabase: SupabaseClient, userId: string): Promise<Profile> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (data) return data as Profile

  const { data: created } = await supabase
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id' })
    .select('*')
    .maybeSingle()
  return (created as Profile | null) ?? { id: userId, ...DEFAULT_PROFILE }
}

/** Newest first. Pass `since` to limit how far back to go. */
export async function loadLogs(
  supabase: SupabaseClient,
  userId: string,
  opts: { since?: string; limit?: number } = {}
): Promise<SleepLog[]> {
  let q = supabase.from('sleep_logs').select('*').eq('user_id', userId).order('sleep_date', { ascending: false })
  if (opts.since) q = q.gte('sleep_date', opts.since)
  q = q.limit(opts.limit ?? 400)
  const { data } = await q
  return (data ?? []) as SleepLog[]
}

export async function loadLatestInsight(supabase: SupabaseClient, userId: string): Promise<SleepInsight | null> {
  const { data } = await supabase
    .from('sleep_insights')
    .select('*')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as SleepInsight | null) ?? null
}

/** A night counts towards analysis once it has a quality rating. */
export function isComplete(log: Pick<SleepLog, 'sleep_quality'>): boolean {
  return typeof log.sleep_quality === 'number'
}
