import Link from 'next/link'
import { LogoMark } from '@/components/ui/Icons'

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <Link href="/" className="mb-10 flex items-center gap-2.5 text-[17px] font-bold tracking-tight">
        <LogoMark size={30} />
        SleepReset
      </Link>
      <div className="card w-full max-w-sm animate-rise-in p-7">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{subtitle}</p>
        <div className="mt-6 space-y-4">{children}</div>
      </div>
      <p className="mt-8 max-w-xs text-center text-xs leading-relaxed text-muted">
        Google is only used to sign you in. Your sleep logs are private to your account.
      </p>
    </main>
  )
}
