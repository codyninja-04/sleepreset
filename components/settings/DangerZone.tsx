'use client'

import { useState } from 'react'

export function DangerZone() {
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove() {
    setBusy(true)
    setError(null)
    const res = await fetch('/api/account', { method: 'DELETE' })
    if (res.ok) {
      window.location.href = '/'
      return
    }
    const data = await res.json().catch(() => ({}))
    setError(data.error || 'Could not delete the account')
    setBusy(false)
  }

  return (
    <section className="card p-5">
      <h2 className="text-base font-semibold">Your data</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">
        Download every night you have logged as a CSV, or delete your account along with all of your logs and insights.
      </p>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <a href="/api/export" className="btn-secondary">
          Export as CSV
        </a>
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn-secondary">
            Sign out
          </button>
        </form>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <label htmlFor="confirm-delete" className="label">
          Delete account
        </label>
        <p className="mb-2.5 text-[13px] text-muted">
          Type <span className="font-semibold text-text">delete</span> to confirm. This cannot be undone.
        </p>
        <div className="flex gap-2">
          <input
            id="confirm-delete"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input"
            autoComplete="off"
          />
          <button
            onClick={remove}
            disabled={confirm.trim().toLowerCase() !== 'delete' || busy}
            className="btn shrink-0 border border-poor/40 text-poor hover:bg-poor/10"
          >
            {busy ? 'Deleting...' : 'Delete'}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-[13px]">
            {error}
          </p>
        )}
      </div>
    </section>
  )
}
