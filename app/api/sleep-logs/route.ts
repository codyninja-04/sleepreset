import { NextResponse } from 'next/server'
import { jsonError, readJson, requireUser } from '@/lib/api'
import { addDays, isDateString, todayIn } from '@/lib/dates'
import { FREE_HISTORY_DAYS, hasPro } from '@/lib/plan'
import { loadProfile } from '@/lib/sleep/load'
import { parseSleepLog } from '@/lib/sleep/validate'

/** GET ?from=YYYY-MM-DD&to=YYYY-MM-DD, newest first. Free accounts see the last 30 days. */
export async function GET(req: Request) {
  const auth = await requireUser()
  if (auth.error) return auth.error
  const { supabase, user } = auth

  const url = new URL(req.url)
  const profile = await loadProfile(supabase, user.id)
  const today = todayIn(profile.timezone)

  let from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  if (from && !isDateString(from)) return jsonError('from should be YYYY-MM-DD')
  if (to && !isDateString(to)) return jsonError('to should be YYYY-MM-DD')

  if (!hasPro(profile)) {
    const floor = addDays(today, -FREE_HISTORY_DAYS)
    if (!from || from < floor) from = floor
  }

  let q = supabase.from('sleep_logs').select('*').eq('user_id', user.id).order('sleep_date', { ascending: false })
  if (from) q = q.gte('sleep_date', from)
  if (to) q = q.lte('sleep_date', to)
  const { data, error } = await q.limit(400)
  if (error) return jsonError('Could not load your logs', 500)

  return NextResponse.json({ logs: data })
}

/** Creates or replaces the log for one night. Saving the same night twice updates it. */
export async function POST(req: Request) {
  const auth = await requireUser()
  if (auth.error) return auth.error
  const { supabase, user } = auth

  const body = await readJson(req)
  if (!body) return jsonError('Invalid request')

  const profile = await loadProfile(supabase, user.id)
  const parsed = parseSleepLog(body, todayIn(profile.timezone))
  if (!parsed.ok) return jsonError(parsed.error)

  const { data, error } = await supabase
    .from('sleep_logs')
    .upsert({ ...parsed.value, user_id: user.id }, { onConflict: 'user_id,sleep_date' })
    .select('*')
    .single()
  if (error) return jsonError('Could not save that night', 500)

  return NextResponse.json({ log: data })
}

/** DELETE ?date=YYYY-MM-DD */
export async function DELETE(req: Request) {
  const auth = await requireUser()
  if (auth.error) return auth.error
  const { supabase, user } = auth

  const date = new URL(req.url).searchParams.get('date')
  if (!isDateString(date)) return jsonError('Which night should be deleted?')

  const { error } = await supabase.from('sleep_logs').delete().eq('user_id', user.id).eq('sleep_date', date)
  if (error) return jsonError('Could not delete that night', 500)
  return NextResponse.json({ ok: true })
}
