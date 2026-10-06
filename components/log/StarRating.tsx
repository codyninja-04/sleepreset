'use client'

import { StarIcon } from '@/components/ui/Icons'

export const QUALITY_WORDS = ['', 'Awful', 'Poor', 'Okay', 'Good', 'Great'] as const

export function StarRating({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Sleep quality">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = value !== null && n <= value
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} out of 5, ${QUALITY_WORDS[n].toLowerCase()}`}
              onClick={() => onChange(n)}
              className={`rounded-lg p-1.5 transition hover:scale-110 active:scale-95 ${
                filled ? 'text-amber-300' : 'text-muted/50 hover:text-muted'
              }`}
            >
              <StarIcon size={32} filled={filled} />
            </button>
          )
        })}
        <span className="ml-2 text-sm font-semibold text-muted" aria-live="polite">
          {value ? QUALITY_WORDS[value] : 'Tap to rate'}
        </span>
      </div>
    </div>
  )
}
