import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { TonightCard } from '@/components/coaching/TonightCard'
import { AnalyzeButton } from '@/components/insights/AnalyzeButton'
import { CorrelationCard } from '@/components/insights/CorrelationCard'
import { PersonalPatternChart } from '@/components/insights/PersonalPatternChart'
import { UnlockProgress } from '@/components/insights/UnlockProgress'
import { ProGate } from '@/components/ui/ProGate'
import { SparkIcon } from '@/components/ui/Icons'
import { hasPro } from '@/lib/plan'
import { MIN_NIGHTS } from '@/lib/sleep/correlations'
import { isComplete, loadLatestInsight, loadLogs, loadProfile } from '@/lib/sleep/load'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Insights' }

function generatedLabel(iso: string, tz: string) {
  return new Intl.DateTimeFormat('en-SG', { timeZone: tz, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(
    new Date(iso)
  )
}

export default async function InsightsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, logs, insight] = await Promise.all([
    loadProfile(supabase, user.id),
    loadLogs(supabase, user.id, { limit: 200 }),
    loadLatestInsight(supabase, user.id),
  ])
  const rated = Math.min(logs.filter(isComplete).length, 90)
  const pro = hasPro(profile)
  const newSince = insight ? Math.max(0, rated - insight.based_on_days) : 0

  const clear = insight?.correlations.filter((c) => c.correlation_strength !== 'none') ?? []
  const unclear = insight?.correlations.filter((c) => c.correlation_strength === 'none') ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your patterns</h1>
          <p className="mt-1 text-sm text-muted">
            {insight
              ? `Based on ${insight.based_on_days} days of data · ${generatedLabel(insight.generated_at, profile.timezone)}`
              : 'Which of your habits actually line up with better or worse sleep.'}
          </p>
        </div>
        {insight && pro && rated >= MIN_NIGHTS && (
          <AnalyzeButton label={newSince ? `Update with ${newSince} new night${newSince === 1 ? '' : 's'}` : 'Refresh'} variant="secondary" />
        )}
      </div>

      {rated < MIN_NIGHTS ? (
        <UnlockProgress count={rated} />
      ) : !pro ? (
        <ProGate
          title="Pattern analysis is part of Pro"
          body={`You have ${rated} rated nights, enough to start finding what moves your sleep. Upgrade to see which of your habits matter most.`}
        />
      ) : !insight ? (
        <section className="card p-6 sm:p-7">
          <p className="eyebrow">Ready</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight">{rated} rated nights. Enough to start looking.</h2>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted">
            We compare your sleep on nights with and without each habit, then point out the one change most likely to
            help you specifically.
          </p>
          <div className="mt-5">
            <AnalyzeButton />
          </div>
        </section>
      ) : (
        <>
          {insight.top_recommendation && (
            <section className="relative overflow-hidden rounded-2xl border border-primary/50 bg-gradient-to-br from-primary/25 via-primary-soft/40 to-surface p-6 shadow-glow">
              <div className="flex items-center gap-2 text-primary">
                <SparkIcon size={16} />
                <p className="text-[11px] font-bold uppercase tracking-[0.1em]">Your highest leverage change</p>
              </div>
              <p className="mt-3 text-lg font-semibold leading-snug sm:text-xl">{insight.top_recommendation}</p>
            </section>
          )}

          <TonightCard />

          <PersonalPatternChart correlations={insight.correlations} />

          {clear.length > 0 ? (
            <div className="space-y-3">
              <h2 className="px-1 text-sm font-semibold text-muted">What lines up with your sleep</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {clear.map((c) => (
                  <CorrelationCard key={c.key} c={c} />
                ))}
              </div>
            </div>
          ) : (
            <section className="card p-5 text-sm leading-relaxed text-muted">
              Nothing stands out clearly yet. That is useful too, it means none of these habits is obviously wrecking
              your sleep. Keep logging and check back in a week.
            </section>
          )}

          {unclear.length > 0 && (
            <details className="card group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                No clear link yet ({unclear.length})
                <span className="text-muted transition group-open:rotate-90">›</span>
              </summary>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {unclear.map((c) => (
                  <CorrelationCard key={c.key} c={c} />
                ))}
              </div>
            </details>
          )}

          <p className="px-1 text-[12px] leading-relaxed text-muted">
            These are patterns in your own logs, not proof that one thing causes another, and not medical advice. If
            you are sleeping badly most nights for weeks, it is worth talking to a doctor.
            {insight.source === 'rules' && ' This analysis used the numbers only, because the AI write up was unavailable.'}
          </p>
        </>
      )}
    </div>
  )
}
