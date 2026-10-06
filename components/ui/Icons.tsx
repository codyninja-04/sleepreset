import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base({ size = 20, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...rest,
  }
}

export function MoonIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z" />
    </svg>
  )
}

export function PenIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  )
}

export function SparkIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  )
}

export function ChartIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 19h16" />
      <path d="m5 15 4-5 4 3 6-7" />
    </svg>
  )
}

export function GearIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  )
}

export function BellIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
    </svg>
  )
}

export function StarIcon({ size = 20, filled = false, ...rest }: IconProps & { filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
    </svg>
  )
}

export function ArrowUpIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  )
}

export function ArrowDownIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  )
}

export function LockIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

export function CheckIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M5 12.5 10 17.5 19 7" />
    </svg>
  )
}

export function ChevronLeftIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  )
}

export function ChevronRightIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="rgb(var(--surface))" />
      <path d="M38 46a16 16 0 0 1-8.6-29.5A16 16 0 1 0 47.5 39 16 16 0 0 1 38 46z" fill="rgb(var(--primary))" />
      <circle cx="44" cy="19" r="2" fill="rgb(var(--text))" />
      <circle cx="50" cy="28" r="1.3" fill="rgb(var(--muted))" />
    </svg>
  )
}
