import Link from 'next/link'
import { StrengthBadge } from '@/components/insights/StrengthBadge'
import { ArrowDownIcon, LogoMark, MoonIcon, SparkIcon } from '@/components/ui/Icons'
import { CHART } from '@/lib/chart'
import { getUser } from '@/lib/supabase/server'

const STEPS = [
  {
    title: 'Log in under a minute',
    body: 'Each morning: when you slept, when you woke, how it felt. Plus a few taps for the day before. Caffeine, screens, exercise, stress, naps.',
  },
  {
    title: 'Let two weeks pile up',
    body: 'Live normally. The more your days vary, the clearer the comparison gets. Nothing unlocks until there is enough data to mean something.',
  },
  {
    title: 'See what is yours',
    body: 'Your sleep on nights with and without each habit, side by side, with an honest strength rating and the one change worth trying first.',
  },
]

function DemoBar({ label, value, n, color }: { label: string; value: number; n: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[12px]">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums">
          <b>{value}</b>
          <span className="text-muted"> / 5 · {n} nights</span>
        </span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-background/70">
        <div className="h-full rounded-full" style={{ width: `${(value / 5) * 100}%`, background: color }} />
      </div>
    </div>
  )
}

export default async function Home() {
  let signedIn = false
  try {
    signedIn = Boolean(await getUser())
  } catch {
    // No Supabase env yet, show the signed out page.
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
          <LogoMark size={28} />
          SleepReset
        </Link>
        {signedIn ? (
          <Link href="/log" className="btn-primary py-2">
            Open app
          </Link>
        ) : (
          <div className="flex items-center gap-1">
            <Link href="/login" className="btn-ghost py-2">
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary py-2">
              Start free
            </Link>
          </div>
        )}
      </header>

      <main>
        <section className="mx-auto grid max-w-5xl items-center gap-12 px-5 pb-20 pt-12 md:grid-cols-[1.1fr_1fr] md:pt-20">
          <div className="animate-rise-in">
            <p className="eyebrow text-primary">Sleep tracking without a wearable</p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
              Find out which of your habits are costing you sleep.
            </h1>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted">
              Not another list of sleep hygiene tips. SleepReset compares your own nights against your own days and
              shows you what actually moves the needle for you.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={signedIn ? '/log' : '/signup'} className="btn-primary px-6 py-3 text-[15px]">
                {signedIn ? 'Log last night' : 'Start logging tonight'}
              </Link>
              <span className="text-[13px] text-muted">Free to log. No watch or ring needed.</span>
            </div>
          </div>

          <div className="relative animate-rise-in [animation-delay:120ms]">
            <div className="absolute -inset-8 -z-10 rounded-[40px] bg-primary/10 blur-3xl" aria-hidden="true" />
            <div className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-[15px] font-semibold">Screens over 1h before bed</h2>
                <StrengthBadge strength="moderate" />
              </div>
              <p className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-poor">
                <ArrowDownIcon size={14} /> Goes with worse sleep for you
              </p>
              <p className="mt-3 text-sm leading-relaxed text-text/90">
                On the 7 nights with more than an hour of screens you rated sleep 2.7 on average, against 3.8 on the 11
                nights with less. You also spent about 40 minutes less in bed.
              </p>
              <div className="mt-4 space-y-3">
                <DemoBar label="Over 1h" value={2.7} n={7} color={CHART.with} />
                <DemoBar label="1h or less" value={3.8} n={11} color={CHART.without} />
              </div>
            </div>
            <div className="card mt-3 border-primary/40 p-4">
              <div className="flex items-center gap-2 text-primary">
                <MoonIcon size={14} />
                <p className="text-[11px] font-bold uppercase tracking-[0.1em]">For tonight</p>
              </div>
              <p className="mt-1.5 text-[15px] font-semibold">Phone away by 10:45pm</p>
            </div>
            <p className="mt-3 text-center text-[11px] text-muted">Example insight. Yours comes from your own logs.</p>
          </div>
        </section>

        <section className="border-y border-border/60 bg-surface/30">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="card p-5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-16">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Honest about what it does not know</h2>
              <p className="mt-3 leading-relaxed text-muted">
                Every comparison shows how many nights it is based on. Patterns are rated strong, moderate, weak or no
                clear link, and the rating can only be as strong as your numbers allow. If two weeks of data says
                nothing yet, it tells you that.
              </p>
              <p className="mt-3 leading-relaxed text-muted">
                It is a habit tracker, not a medical device. It will never try to diagnose anything.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-5">
                <p className="font-semibold">Free</p>
                <ul className="mt-3 space-y-1.5 text-[13px] text-muted">
                  <li>Daily logging</li>
                  <li>30 day trend charts</li>
                  <li>A simple tip for tonight</li>
                </ul>
              </div>
              <div className="card border-primary/50 p-5 shadow-glow">
                <p className="flex items-center gap-1.5 font-semibold">
                  <SparkIcon size={14} className="text-primary" /> Pro
                </p>
                <p className="text-[13px] text-muted">$5 a month</p>
                <ul className="mt-3 space-y-1.5 text-[13px] text-muted">
                  <li>AI pattern analysis</li>
                  <li>Coaching for tonight</li>
                  <li>Wind-down reminders</li>
                  <li>Full history</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-[12px] text-muted">
          <span>SleepReset · made in Singapore for people who sleep too little</span>
          <span>Not medical advice</span>
        </div>
      </footer>
    </div>
  )
}
