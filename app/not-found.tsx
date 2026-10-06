import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Nothing here</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">This page does not exist.</p>
      <Link href="/log" className="btn-primary mt-6">
        Back to your log
      </Link>
    </main>
  )
}
