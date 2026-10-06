'use client'

import { useEffect, useState } from 'react'
import { BellIcon, MoonIcon } from '@/components/ui/Icons'
import { formatClock, minutesToTime, timeToMinutes } from '@/lib/dates'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

const WIND_DOWN = [15, 30, 45, 60, 90, 120]

type Support = 'checking' | 'unsupported' | 'denied' | 'ready'

async function patchProfile(body: Record<string, unknown>) {
  const res = await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not save')
}

/**
 * Target bedtime and wind-down length live on the profile. The push
 * subscription lives per device, so turning reminders on is a per device thing.
 */
export function WindDownSettings({
  targetBedtime,
  windDownMinutes,
  enabled: initialEnabled,
  timezone,
  pro,
}: {
  targetBedtime: string
  windDownMinutes: number
  enabled: boolean
  timezone: string
  pro: boolean
}) {
  const [support, setSupport] = useState<Support>('checking')
  const [subscribed, setSubscribed] = useState(false)
  const [target, setTarget] = useState(targetBedtime)
  const [windDown, setWindDown] = useState(windDownMinutes)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window) || !vapid) {
      setSupport('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setSupport('denied')
      return
    }
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setSubscribed(Boolean(sub) && initialEnabled)
        setSupport('ready')
      })
      .catch(() => setSupport('unsupported'))
  }, [vapid, initialEnabled])

  async function saveSchedule(patch: { target_bedtime?: string; wind_down_minutes?: number }) {
    setMessage(null)
    try {
      await patchProfile(patch)
      setMessage('Saved.')
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  async function enable() {
    setBusy(true)
    setMessage(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setSupport(permission === 'denied' ? 'denied' : 'ready')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid!) as BufferSource,
        }))
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error)
      setSubscribed(true)
      setMessage('Wind-down reminders are on for this device.')
    } catch (err) {
      setMessage((err as Error).message || 'Could not turn on reminders. Check your browser settings and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    setBusy(true)
    setMessage(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub?.endpoint }),
      })
      await sub?.unsubscribe()
      setSubscribed(false)
      setMessage('Wind-down reminders are off for this device.')
    } finally {
      setBusy(false)
    }
  }

  const startsAt = target ? formatClock(minutesToTime(timeToMinutes(target) - windDown)) : null

  return (
    <section className="card p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <MoonIcon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">Bedtime and wind-down</h2>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
            Used for tonight&apos;s suggestion, the bedtime chart and your reminder.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="target" className="label">
            Target lights out
          </label>
          <input
            id="target"
            type="time"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onBlur={() => target && target !== targetBedtime && saveSchedule({ target_bedtime: target })}
            className="input tabular-nums"
          />
        </div>
        <div>
          <label htmlFor="winddown" className="label">
            Start winding down
          </label>
          <select
            id="winddown"
            value={windDown}
            onChange={(e) => {
              const v = Number(e.target.value)
              setWindDown(v)
              saveSchedule({ wind_down_minutes: v })
            }}
            className="input"
          >
            {WIND_DOWN.map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `${m} minutes` : m === 60 ? '1 hour' : `${m / 60} hours`.replace('1.5 hours', '1 hour 30')} before
              </option>
            ))}
          </select>
        </div>
      </div>
      {startsAt && (
        <p className="mt-2 text-[12px] text-muted">
          Wind-down starts at <span className="font-semibold text-text">{startsAt}</span> · {timezone.replace(/_/g, ' ')}
        </p>
      )}

      <div className="mt-5 border-t border-border/70 pt-5">
        <div className="flex items-center gap-2">
          <BellIcon size={16} className="text-muted" />
          <h3 className="text-sm font-semibold">Wind-down reminder</h3>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          One quiet notification when wind-down starts, with tonight&apos;s suggestion. Nothing else.
        </p>
        <div className="mt-3">
          {!pro ? (
            <p className="text-[13px] text-muted">Wind-down reminders are part of Pro.</p>
          ) : support === 'checking' ? (
            <div className="h-10 w-40 animate-pulse rounded-xl bg-subtle" />
          ) : support === 'unsupported' ? (
            <p className="text-[13px] text-muted">
              This browser does not support push notifications. On iPhone, add SleepReset to your home screen first.
            </p>
          ) : support === 'denied' ? (
            <p className="text-[13px] text-muted">
              Notifications are blocked for this site. Allow them in your browser settings, then reload.
            </p>
          ) : subscribed ? (
            <button onClick={disable} disabled={busy} className="btn-secondary">
              {busy ? 'Turning off...' : 'Turn off on this device'}
            </button>
          ) : (
            <button onClick={enable} disabled={busy} className="btn-primary">
              {busy ? 'Turning on...' : 'Turn on reminders'}
            </button>
          )}
        </div>
      </div>

      {message && (
        <p className="mt-3 text-[13px] text-muted" aria-live="polite">
          {message}
        </p>
      )}
    </section>
  )
}
