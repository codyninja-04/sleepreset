'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoMark } from '@/components/ui/Icons'
import { NAV, isActive } from './nav'

export function Header({ name }: { name: string | null }) {
  const pathname = usePathname()
  const initial = (name?.trim()[0] ?? 'S').toUpperCase()

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link href="/log" className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
          <LogoMark size={26} />
          SleepReset
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map(({ href, label }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active ? 'bg-subtle text-text' : 'text-muted hover:text-text'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <Link
          href="/settings"
          className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-[13px] font-bold text-text md:hidden"
          aria-label="Settings"
        >
          {initial}
        </Link>
      </div>
    </header>
  )
}
