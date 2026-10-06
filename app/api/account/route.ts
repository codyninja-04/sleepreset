import { NextResponse } from 'next/server'
import { jsonError, requireUser } from '@/lib/api'
import { createServiceClient } from '@/lib/supabase/server'

/** Deletes the auth user. Every table cascades from auth.users. */
export async function DELETE() {
  const auth = await requireUser()
  if (auth.error) return auth.error
  const { supabase, user } = auth

  try {
    const admin = createServiceClient()
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw error
  } catch (err) {
    console.error('account delete failed', err)
    return jsonError('Could not delete the account. Try again in a moment.', 500)
  }

  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
