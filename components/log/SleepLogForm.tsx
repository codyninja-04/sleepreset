'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDuration, shortTime, sleepMinutes } from '@/lib/dates'
import type { SleepLog } from '@/lib/types'
import { HabitTags, type HabitValues } from './HabitTags'
import { StarRating } from './StarRating'

const STRESS = [
  { value: 1, label: 'Calm' },
  { value: 2, label: 'Light' },
  { value: 3, label: 'Some' },
  { value: 4, label: 'High' },
  { value: 5, label: 'Maxed' },
]

const SCREEN_MAX = 180

interface FormState extends HabitValues {
  bedtime: string
  wake_time: string
  sleep_quality: number | null
  times_woken: number
  screen_time_before_bed_minutes: number | null
  stress_level: number | null
  notes: string
}

function fromLog(log: SleepLog | null, suggested: { bedtime: string | null; wake: string | null } | null): FormState {
  return {
    bedtime: shortTime(log?.bedtime) ?? suggested?.bedtime ?? '',
    wake_time: shortTime(log?.wake_time) ?? suggested?.wake ?? '',
    sleep_quality: log?.sleep_quality ?? null,
    times_woken: log?.times_woken ?? 0,
    caffeine_after_2pm: log?.caffeine_after_2pm ?? false,
    alcohol_consumed: log?.alcohol_consumed ?? false,
    exercised_today: log?.exercised_today ?? false,
    exercise_time: log?.exercise_time ?? 'none',
    nap_taken: log?.nap_taken ?? false,
    nap_duration_minutes: log?.nap_duration_minutes ?? null,
    screen_time_before_bed_minutes: log?.screen_time_before_bed_minutes ?? null,
    stress_level: log?.stress_level ?? null,
    notes: log?.notes ?? '',
  }
}

function screenLabel(m: number | null) {
  if (m === null) return 'Not set'
  if (m === 0) return 'None'
  if (m >= SCREEN_MAX) return '3h or more'
  return formatDuration(m)
}

function Section({ step, title, hint, children }: { step: string; title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <p className="eyebrow">{step}</p>
      <h2 className="mt-1 text-lg font-bold tracking-tight">{title}</h2>
      <p className="mt-0.5 text-[13px] text-muted">{hint}</p>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  )
}

/**
 * The whole log on one screen, built to be done in under a minute. A row can
 * be saved half finished, so habits can go in before bed and the sleep part
 * the next morning. Only nights with a quality rating feed the analysis.
 */
export function SleepLogForm({
  date,
  isTonight,
  initial,
  suggested,
}: {
  date: string
  isTonight: boolean
  initial: SleepLog | null
  suggested: { bedtime: string | null; wake: string | null } | null
}) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(() => fromLog(initial, isTonight ? null : suggested))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [showNotes, setShowNotes] = useState(Boolean(initial?.notes))

  const set = (patch: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...patch }))
    setMessage(null)
  }

  const duration = useMemo(() => sleepMinutes(form.bedtime || null, form.wake_time || null), [form.bedtime, form.wake_time])
  const complete = form.sleep_quality !== null

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (form.exercised_today && (!form.exercise_time || form.exercise_time === 'none')) {
      setMessage({ tone: 'error', text: 'Pick when you exercised, it matters for sleep.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/sleep-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sleep_date: date,
          bedtime: form.bedtime || null,
          wake_time: form.wake_time || null,
          notes: form.notes || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not save that night')
      setMessage({
        tone: 'ok',
        text: complete ? 'Saved. That night now counts towards your patterns.' : 'Saved. Add how you slept when you wake up.',
      })
      router.refresh()
    } catch (err) {
      setMessage({ tone: 'error', text: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirm('Delete this night? This cannot be undone.')) return
    setDeleting(true)
    const res = await fetch(`/api/sleep-logs?date=${date}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) {
      setForm(fromLog(null, null))
      setMessage({ tone: 'ok', text: 'Deleted.' })
      router.refresh()
    } else {
      setMessage({ tone: 'error', text: 'Could not delete that night.' })
    }
  }

  const night = (
    <Section
      key="night"
      step={isTonight ? 'Tomorrow morning' : 'The night'}
      title="How did you sleep?"
      hint={isTonight ? 'Come back after you wake up to finish this part.' : 'Roughly is fine. Your best guess beats a blank.'}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="bedtime" className="label">
            Lights out
          </label>
          <input
            id="bedtime"
            type="time"
            value={form.bedtime}
            onChange={(e) => set({ bedtime: e.target.value })}
            className="input tabular-nums"
          />
        </div>
        <div>
          <label htmlFor="wake" className="label">
            Woke up
          </label>
          <input
            id="wake"
            type="time"
            value={form.wake_time}
            onChange={(e) => set({ wake_time: e.target.value })}
            className="input tabular-nums"
          />
        </div>
      </div>
      {duration !== null && (
        <p className="-mt-2 text-[13px] text-muted">
          <span className="font-semibold tabular-nums text-text">{formatDuration(duration)}</span> in bed
          {duration > 14 * 60 && ' (double check the times)'}
        </p>
      )}

      <div>
        <p className="label">Sleep quality</p>
        <StarRating value={form.sleep_quality} onChange={(v) => set({ sleep_quality: v })} />
      </div>

      <div>
        <p className="label" id="woken-label">
          Times you woke up
        </p>
        <div className="flex items-center gap-3" role="group" aria-labelledby="woken-label">
          <button
            type="button"
            onClick={() => set({ times_woken: Math.max(0, form.times_woken - 1) })}
            className="btn-secondary h-10 w-10 p-0 text-lg"
            aria-label="One fewer"
          >
            -
          </button>
          <span className="w-8 text-center text-xl font-bold tabular-nums">{form.times_woken}</span>
          <button
            type="button"
            onClick={() => set({ times_woken: Math.min(30, form.times_woken + 1) })}
            className="btn-secondary h-10 w-10 p-0 text-lg"
            aria-label="One more"
          >
            +
          </button>
        </div>
      </div>
    </Section>
  )

  const day = (
    <Section
      key="day"
      step={isTonight ? 'Today' : 'The day before'}
      title="What did the day look like?"
      hint="These are the things we check against your sleep."
    >
      <HabitTags value={form} onChange={set} />

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <label htmlFor="screen" className="text-[13px] font-semibold">
            Screens in the hour or so before bed
          </label>
          <span className={`text-sm font-semibold tabular-nums ${form.screen_time_before_bed_minutes === null ? 'text-muted' : ''}`}>
            {screenLabel(form.screen_time_before_bed_minutes)}
          </span>
        </div>
        <input
          id="screen"
          type="range"
          min={0}
          max={SCREEN_MAX}
          step={15}
          value={form.screen_time_before_bed_minutes ?? 60}
          onChange={(e) => set({ screen_time_before_bed_minutes: Number(e.target.value) })}
          className={`w-full ${form.screen_time_before_bed_minutes === null ? 'opacity-40' : ''}`}
        />
        <div className="mt-1 flex justify-between text-[11px] text-muted">
          <span>None</span>
          <span>1h</span>
          <span>2h</span>
          <span>3h+</span>
        </div>
      </div>

      <div>
        <p className="label" id="stress-label">
          Stress level
        </p>
        <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-labelledby="stress-label">
          {STRESS.map((s) => {
            const on = form.stress_level === s.value
            return (
              <button
                key={s.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set({ stress_level: s.value })}
                className={`rounded-xl border px-1 py-2.5 text-center transition ${
                  on ? 'border-primary/70 bg-primary/15' : 'border-border bg-background/40 hover:border-muted/50'
                }`}
              >
                <span className="block text-base font-bold tabular-nums">{s.value}</span>
                <span className="block text-[11px] text-muted">{s.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {showNotes ? (
        <div>
          <label htmlFor="notes" className="label">
            Notes
          </label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={(e) => set({ notes: e.target.value })}
            maxLength={500}
            rows={2}
            placeholder="Late deadline, neighbour renovating, kid woke up..."
            className="input resize-none"
          />
        </div>
      ) : (
        <button type="button" onClick={() => setShowNotes(true)} className="text-[13px] font-semibold text-primary">
          + Add a note
        </button>
      )}
    </Section>
  )

  return (
    <form onSubmit={save} className="space-y-4">
      {isTonight ? [day, night] : [night, day]}

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 md:bottom-4">
        <div className="card flex items-center gap-3 p-3 shadow-glow">
          <button type="submit" disabled={saving} className="btn-primary flex-1 py-3 text-[15px]">
            {saving ? 'Saving...' : complete ? 'Save night' : isTonight ? 'Save today' : 'Save, finish later'}
          </button>
          {initial && (
            <button type="button" onClick={remove} disabled={deleting} className="btn-ghost px-3 text-[13px]">
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
        {message && (
          <p
            role={message.tone === 'error' ? 'alert' : 'status'}
            className={`mt-2 rounded-xl border px-3 py-2 text-[13px] backdrop-blur-md ${
              message.tone === 'error' ? 'border-poor/40 bg-poor/10' : 'border-good/30 bg-good/10'
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </form>
  )
}
