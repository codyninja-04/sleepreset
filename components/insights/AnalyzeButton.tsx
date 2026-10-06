'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SparkIcon } from '@/components/ui/Icons'

export function AnalyzeButton({ label = 'Find my patterns', variant = 'primary' }: { label?: string; variant?: 'primary' | 'secondary' }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/insights/analyze', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not run the analysis')
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button onClick={run} disabled={busy} className={variant === 'primary' ? 'btn-primary' : 'btn-secondary'}>
        <SparkIcon size={16} className={busy ? 'animate-spin' : ''} />
        {busy ? 'Reading your nights...' : label}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-poor">
          {error}
        </p>
      )}
    </div>
  )
}
