'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * The only way in. Supabase handles the OAuth dance, we pass along where the
 * user was heading so the callback can send them back there.
 */
export function GoogleButton({ next = '/log', label = 'Continue with Google' }: { next?: string; label?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signIn() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const redirect = new URL('/auth/callback', window.location.origin)
    redirect.searchParams.set('next', next)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirect.toString() },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <button onClick={signIn} disabled={loading} className="btn-secondary w-full py-3 text-[15px]">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
          />
          <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z" />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z"
          />
        </svg>
        {loading ? 'Opening Google...' : label}
      </button>

      {error && (
        <p role="alert" className="rounded-xl border border-border bg-subtle px-3 py-2 text-[13px] text-text">
          {error}
        </p>
      )}
    </div>
  )
}
