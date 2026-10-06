import { NextResponse } from 'next/server'
import { rulesTonight } from '@/lib/claude/tonight-coach'
import { addDays, minutesIn, shortTime, timeToMinutes, todayIn } from '@/lib/dates'
import { hasPro } from '@/lib/plan'
import { pushConfigured, sendPush } from '@/lib/push'
import { createServiceClient } from '@/lib/supabase/server'
import type { Profile, SleepInsight, SleepLog } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * The cron runs every 15 minutes, but scheduled GitHub runs often start late.
 * Anyone whose wind-down started in the last hour is due, and
 * last_reminded_on stops a second send on the same day.
 */
const WINDOW = 60

/** True when `now` falls in [start, start + WINDOW), wrapping past midnight. */
function inWindow(now: number, start: number): boolean {
  return (now - start + 1440) % 1440 < WINDOW
}

/**
 * Runs every 15 minutes (see .github/workflows/wind-down.yml). Sends each
 * opted in user one nudge when their wind-down time arrives, carrying
 * tonight's suggestion if one was already written. Never twice in one day.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  if (!pushConfigured()) return NextResponse.json({ skipped: 'VAPID keys not set' })

  const supabase = createServiceClient()
  const { data: profiles } = await supabase.from('profiles').select('*').eq('reminder_enabled', true)

  const now = new Date()
  let due = 0
  let sent = 0

  for (const p of (profiles ?? []) as Profile[]) {
    if (!hasPro(p)) continue
    const target = timeToMinutes(shortTime(p.target_bedtime) ?? '23:30')
    const start = (target - p.wind_down_minutes + 1440) % 1440
    const nowMin = minutesIn(p.timezone, now)
    if (!inWindow(nowMin, start)) continue
    // A window that opened at 23:50 is still yesterday's night at 00:20.
    const today = nowMin < start ? addDays(todayIn(p.timezone), -1) : todayIn(p.timezone)
    if (p.last_reminded_on === today) continue
    due++

    const { data: subs } = await supabase.from('push_subscriptions').select('endpoint, p256dh, auth').eq('user_id', p.id)
    await supabase.from('profiles').update({ last_reminded_on: today }).eq('id', p.id)
    if (!subs?.length) continue

    let body: string
    const { data: cached } = await supabase
      .from('tonight_coaching')
      .select('headline, detail')
      .eq('user_id', p.id)
      .eq('for_date', today)
      .maybeSingle()
    if (cached) {
      body = `${cached.headline}. ${cached.detail}`
    } else {
      const [{ data: logs }, { data: insight }] = await Promise.all([
        supabase.from('sleep_logs').select('*').eq('user_id', p.id).order('sleep_date', { ascending: false }).limit(8),
        supabase
          .from('sleep_insights')
          .select('correlations')
          .eq('user_id', p.id)
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      const all = (logs ?? []) as SleepLog[]
      const tip = rulesTonight({
        profile: p,
        today: all.find((l) => l.sleep_date === today) ?? null,
        recent: all.filter((l) => l.sleep_date !== today),
        correlations: (insight as Pick<SleepInsight, 'correlations'> | null)?.correlations ?? [],
      })
      body = `${tip.headline}. ${tip.detail}`
    }

    for (const sub of subs) {
      const result = await sendPush(sub, { title: 'Time to wind down', body: body.slice(0, 220), url: '/log' })
      if (result === 'sent') sent++
      if (result === 'gone') await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    }
  }

  return NextResponse.json({ due, sent })
}
