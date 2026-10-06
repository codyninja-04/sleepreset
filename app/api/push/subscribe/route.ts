import { NextResponse } from 'next/server'
import { jsonError, readJson, requireUser } from '@/lib/api'
import { PRO_REQUIRED, hasPro } from '@/lib/plan'
import { loadProfile } from '@/lib/sleep/load'

interface SubscriptionBody {
  endpoint?: unknown
  keys?: { p256dh?: unknown; auth?: unknown }
}

export async function POST(req: Request) {
  const auth = await requireUser()
  if (auth.error) return auth.error
  const { supabase, user } = auth

  const profile = await loadProfile(supabase, user.id)
  if (!hasPro(profile)) return jsonError(PRO_REQUIRED, 402)

  const body = await readJson<SubscriptionBody>(req)
  const endpoint = body?.endpoint
  const p256dh = body?.keys?.p256dh
  const key = body?.keys?.auth
  if (
    typeof endpoint !== 'string' ||
    !endpoint.startsWith('https://') ||
    typeof p256dh !== 'string' ||
    typeof key !== 'string'
  ) {
    return jsonError('Invalid subscription')
  }

  // The same device subscribing again replaces its old row.
  await supabase.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', endpoint)
  const { error } = await supabase.from('push_subscriptions').insert({ user_id: user.id, endpoint, p256dh, auth: key })
  if (error) return jsonError('Could not save the subscription', 500)

  await supabase.from('profiles').update({ reminder_enabled: true }).eq('id', user.id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const auth = await requireUser()
  if (auth.error) return auth.error
  const { supabase, user } = auth

  const body = await readJson<{ endpoint?: unknown }>(req)
  if (typeof body?.endpoint === 'string') {
    await supabase.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', body.endpoint)
  }

  const { count } = await supabase
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
  if (!count) await supabase.from('profiles').update({ reminder_enabled: false }).eq('id', user.id)

  return NextResponse.json({ ok: true })
}
