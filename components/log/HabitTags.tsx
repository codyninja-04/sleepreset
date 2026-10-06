'use client'

import type { ExerciseTime } from '@/lib/types'
import { CheckIcon } from '@/components/ui/Icons'

export interface HabitValues {
  caffeine_after_2pm: boolean
  alcohol_consumed: boolean
  exercised_today: boolean
  exercise_time: ExerciseTime | null
  nap_taken: boolean
  nap_duration_minutes: number | null
}

const EXERCISE_TIMES: { value: Exclude<ExerciseTime, 'none'>; label: string }[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
]

const NAP_LENGTHS = [15, 20, 30, 45, 60, 90]

function Toggle({
  on,
  label,
  hint,
  onClick,
}: {
  on: boolean
  label: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
        on ? 'border-primary/70 bg-primary/10' : 'border-border bg-background/40 hover:border-muted/50'
      }`}
    >
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${
          on ? 'border-primary bg-primary text-white' : 'border-muted/50'
        }`}
      >
        {on && <CheckIcon size={13} strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-[12px] text-muted">{hint}</span>
      </span>
    </button>
  )
}

/**
 * The yes or no parts of the day. Exercise and naps open a small follow up
 * so timing gets captured without adding another screen.
 */
export function HabitTags({ value, onChange }: { value: HabitValues; onChange: (patch: Partial<HabitValues>) => void }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <Toggle
        on={value.caffeine_after_2pm}
        label="Caffeine after 2pm"
        hint="Coffee, tea, kopi, energy drinks"
        onClick={() => onChange({ caffeine_after_2pm: !value.caffeine_after_2pm })}
      />
      <Toggle
        on={value.alcohol_consumed}
        label="Alcohol"
        hint="Any drinks in the evening"
        onClick={() => onChange({ alcohol_consumed: !value.alcohol_consumed })}
      />

      <div className="space-y-2">
        <Toggle
          on={value.exercised_today}
          label="Exercised"
          hint="Gym, run, sport, a proper walk"
          onClick={() =>
            onChange(
              value.exercised_today
                ? { exercised_today: false, exercise_time: 'none' }
                : { exercised_today: true, exercise_time: null }
            )
          }
        />
        {value.exercised_today && (
          <div className="flex flex-wrap gap-1.5 pl-1 animate-fade-in" role="radiogroup" aria-label="When did you exercise">
            {EXERCISE_TIMES.map((t) => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={value.exercise_time === t.value}
                onClick={() => onChange({ exercise_time: t.value })}
                className={`chip ${value.exercise_time === t.value ? 'chip-on' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Toggle
          on={value.nap_taken}
          label="Napped"
          hint="Any daytime sleep"
          onClick={() =>
            onChange(
              value.nap_taken
                ? { nap_taken: false, nap_duration_minutes: null }
                : { nap_taken: true, nap_duration_minutes: 20 }
            )
          }
        />
        {value.nap_taken && (
          <div className="flex flex-wrap gap-1.5 pl-1 animate-fade-in" role="radiogroup" aria-label="Nap length">
            {NAP_LENGTHS.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={value.nap_duration_minutes === m}
                onClick={() => onChange({ nap_duration_minutes: m })}
                className={`chip tabular-nums ${value.nap_duration_minutes === m ? 'chip-on' : ''}`}
              >
                {m < 60 ? `${m}m` : `${m / 60}h`.replace('1.5h', '1h 30m')}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
