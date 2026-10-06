'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * "Today" depends on where the user is. On first load in a new timezone we
 * quietly save the browser's zone and refresh so "last night" means the right night.
 */
export function TimezoneSync({ saved }: { saved: string }) {
  const router = useRouter()

  useEffect(() => {
    let tz: string | undefined
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      return
    }
    if (!tz || tz === saved) return

    fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone: tz }),
    })
      .then((r) => {
        if (r.ok) router.refresh()
      })
      .catch(() => {})
  }, [saved, router])

  return null
}
