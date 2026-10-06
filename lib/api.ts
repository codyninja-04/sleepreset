import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

/** Resolves the signed in user for an API route, or a 401 response to return. */
export async function requireUser(): Promise<
  { supabase: ReturnType<typeof createClient>; user: User; error?: never } | { error: NextResponse }
> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: jsonError('Sign in first', 401) }
  return { supabase, user }
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}

export function cleanText(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim().replace(/\s+/g, ' ')
  return t ? t.slice(0, max) : null
}

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
}
