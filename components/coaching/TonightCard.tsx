'use client'

import { useEffect, useState } from 'react'
import type { TonightCoaching } from '@/lib/types'
import { MoonIcon } from '@/components/ui/Icons'

/**
 * Loads after the page so a slow Claude call never holds up logging. If it
 * fails the card just does not appear; it is a nice to have, not the point.
 */
export function TonightCard({ refreshKey }: { refreshKey?: string }) {
  const [coaching, setCoaching] = useState<TonightCoaching | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')

  useEffect(() => {
    let cancelled = false
    setState('loading')
    fetch('/api/coaching/tonight')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (cancelled) return
        setCoaching(d.coaching)
        setState('ready')
      })
      .catch(() => !cancelled && setState('failed'))
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  if (state === 'failed') return null

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary-soft/60 via-surface/90 to-surface p-5" aria-live="polite">
      <div className="pointer-events-none absolute right-5 top-4 flex gap-3 text-text" aria-hidden="true">
        <span className="h-1 w-1 animate-twinkle rounded-full bg-current" />
        <span className="mt-3 h-0.5 w-0.5 animate-twinkle rounded-full bg-current [animation-delay:1.3s]" />
        <span className="mt-1 h-1 w-1 animate-twinkle rounded-full bg-current [animation-delay:2.6s]" />
      </div>
      <div className="flex items-center gap-2 text-primary">
        <MoonIcon size={16} />
        <p className="text-[11px] font-bold uppercase tracking-[0.1em]">For tonight</p>
      </div>
      {state === 'loading' || !coaching ? (
        <div className="mt-3 space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded bg-subtle" />
          <div className="h-4 w-full animate-pulse rounded bg-subtle/70" />
        </div>
      ) : (
        <div className="animate-fade-in">
          <h2 className="mt-2 text-[17px] font-bold leading-snug">{coaching.headline}</h2>
          <p className="mt-1 text-sm leading-relaxed text-text/80">{coaching.detail}</p>
        </div>
      )}
    </section>
  )
}
