import { NextResponse } from 'next/server'
import { cleanText, jsonError, readJson, requireUser } from '@/lib/api'
import { isTimeString, isValidTimezone } from '@/lib/dates'

export async function PATCH(req: Request) {
  const auth = await requireUser()
  if (auth.error) return auth.error
  const { supabase, user } = auth

  const body = await readJson(req)
  if (!body) return jsonError('Invalid request')

  const update: Record<string, unknown> = {}
  if ('display_name' in body) update.display_name = cleanText(body.display_name, 60)
  if ('timezone' in body) {
    if (typeof body.timezone !== 'string' || !isValidTimezone(body.timezone)) return jsonError('Unknown timezone')
    update.timezone = body.timezone
  }
  if ('target_bedtime' in body) {
    if (!isTimeString(body.target_bedtime)) return jsonError('Bedtime should look like 23:30')
    update.target_bedtime = String(body.target_bedtime).slice(0, 5)
  }
  if ('wind_down_minutes' in body) {
    const m = Number(body.wind_down_minutes)
    if (!Number.isInteger(m) || m < 15 || m > 120) return jsonError('Wind-down should be between 15 and 120 minutes')
    update.wind_down_minutes = m
  }
  if (!Object.keys(update).length) return jsonError('Nothing to update')

  const { data, error } = await supabase.from('profiles').update(update).eq('id', user.id).select('*').single()
  if (error) return jsonError('Could not save your settings', 500)
  return NextResponse.json({ profile: data })
}
