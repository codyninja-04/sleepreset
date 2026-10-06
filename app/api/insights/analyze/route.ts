import { NextResponse } from 'next/server'
import { jsonError, requireUser } from '@/lib/api'
import { claudeConfigured } from '@/lib/claude/client'
import { analyzeCorrelations, rulesAnalysis } from '@/lib/claude/correlation-analyzer'
import { todayIn } from '@/lib/dates'
import { PRO_REQUIRED, hasPro } from '@/lib/plan'
import { MIN_NIGHTS, computeFactors } from '@/lib/sleep/correlations'
import { isComplete, loadLatestInsight, loadLogs, loadProfile } from '@/lib/sleep/load'

export const maxDuration = 60

/** How long a fresh analysis is reused when no new nights have been logged. */
const COOLDOWN_MS = 6 * 60 * 60 * 1000
/** Look at roughly the last three months. Older habits say less about now. */
const WINDOW = 90

/**
 * Recomputes the factor stats from the logs and asks Claude to explain them.
 * Falls back to a plain numbers only write up if Claude is unavailable, so
 * the insights page always has something honest to show.
 */
export async function POST() {
  const auth = await requireUser()
  if (auth.error) return auth.error
  const { supabase, user } = auth

  const profile = await loadProfile(supabase, user.id)
  if (!hasPro(profile)) return jsonError(PRO_REQUIRED, 402)

  const logs = (await loadLogs(supabase, user.id, { limit: 200 })).filter(isComplete).slice(0, WINDOW)
  if (logs.length < MIN_NIGHTS) {
    const left = MIN_NIGHTS - logs.length
    return jsonError(`Log ${left} more night${left === 1 ? '' : 's'} with a quality rating to unlock patterns.`, 422)
  }

  const latest = await loadLatestInsight(supabase, user.id)
  if (
    latest &&
    latest.based_on_days === logs.length &&
    Date.now() - new Date(latest.generated_at).getTime() < COOLDOWN_MS
  ) {
    return NextResponse.json({ insight: latest, cached: true })
  }

  const factors = computeFactors(logs)
  let result = rulesAnalysis(factors)
  let source: 'ai' | 'rules' = 'rules'
  if (claudeConfigured()) {
    try {
      result = await analyzeCorrelations(logs, factors)
      source = 'ai'
    } catch (err) {
      console.error('correlation analysis failed', (err as Error).message)
    }
  }

  const { data, error } = await supabase
    .from('sleep_insights')
    .insert({
      user_id: user.id,
      based_on_days: logs.length,
      correlations: result.correlations,
      top_recommendation: result.top_recommendation,
      source,
    })
    .select('*')
    .single()
  if (error) return jsonError('Could not save the analysis', 500)

  // Tonight's suggestion leans on the latest analysis, so let it regenerate.
  await supabase.from('tonight_coaching').delete().eq('user_id', user.id).eq('for_date', todayIn(profile.timezone))

  return NextResponse.json({ insight: data, cached: false })
}
