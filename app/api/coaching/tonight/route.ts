import { NextResponse } from 'next/server'
import { jsonError, requireUser } from '@/lib/api'
import { claudeConfigured } from '@/lib/claude/client'
import { coachTonight, rulesTonight } from '@/lib/claude/tonight-coach'
import { todayIn } from '@/lib/dates'
import { hasPro } from '@/lib/plan'
import { loadLatestInsight, loadLogs, loadProfile } from '@/lib/sleep/load'
import type { TonightCoaching } from '@/lib/types'

export const maxDuration = 30

/**
 * GET tonight's one suggestion. Cached per day so the page and the wind-down
 * push say the same thing, and regenerated if today's habits change after it
 * was written. Free accounts get the rules based version.
 */
export async function GET() {
  const auth = await requireUser()
  if (auth.error) return auth.error
  const { supabase, user } = auth

  const profile = await loadProfile(supabase, user.id)
  const today = todayIn(profile.timezone)

  const [{ data: cached }, logs, insight] = await Promise.all([
    supabase.from('tonight_coaching').select('*').eq('user_id', user.id).eq('for_date', today).maybeSingle(),
    loadLogs(supabase, user.id, { limit: 14 }),
    loadLatestInsight(supabase, user.id),
  ])

  const todayLog = logs.find((l) => l.sleep_date === today) ?? null
  const stale =
    cached && todayLog?.updated_at && new Date(todayLog.updated_at).getTime() > new Date(cached.created_at).getTime()
  if (cached && !stale) {
    return NextResponse.json({ coaching: cached as TonightCoaching })
  }

  const ctx = {
    profile,
    today: todayLog,
    recent: logs.filter((l) => l.sleep_date !== today),
    correlations: insight?.correlations ?? [],
  }

  let suggestion = rulesTonight(ctx)
  let source: 'ai' | 'rules' = 'rules'
  if (hasPro(profile) && claudeConfigured()) {
    try {
      suggestion = await coachTonight(ctx)
      source = 'ai'
    } catch (err) {
      console.error('tonight coaching failed', (err as Error).message)
    }
  }

  const { data, error } = await supabase
    .from('tonight_coaching')
    .upsert(
      { user_id: user.id, for_date: today, ...suggestion, source, created_at: new Date().toISOString() },
      { onConflict: 'user_id,for_date' }
    )
    .select('for_date, headline, detail, source')
    .single()
  if (error) return jsonError('Could not save tonight’s suggestion', 500)

  return NextResponse.json({ coaching: data as TonightCoaching })
}
