import type { Strength } from '@/lib/types'

const STYLE: Record<Strength, { label: string; className: string; bars: number }> = {
  strong: { label: 'Strong', className: 'text-strong border-strong/40 bg-strong/10', bars: 3 },
  moderate: { label: 'Moderate', className: 'text-moderate border-moderate/40 bg-moderate/10', bars: 2 },
  weak: { label: 'Weak', className: 'text-muted border-weak/50 bg-weak/10', bars: 1 },
  none: { label: 'No clear link', className: 'text-muted border-border bg-transparent', bars: 0 },
}

/** Strength shown as a word plus a little three bar meter, so it never relies on colour alone. */
export function StrengthBadge({ strength }: { strength: Strength }) {
  const s = STYLE[strength]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${s.className}`}>
      <span className="flex items-end gap-[2px]" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`w-[3px] rounded-sm ${i <= s.bars ? 'bg-current' : 'bg-current opacity-25'}`}
            style={{ height: 4 + i * 2 }}
          />
        ))}
      </span>
      {s.label}
    </span>
  )
}
