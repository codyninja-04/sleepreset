import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { DangerZone } from '@/components/settings/DangerZone'
import { WindDownSettings } from '@/components/settings/WindDownSettings'
import { shortTime } from '@/lib/dates'
import { hasPro, limitsEnforced } from '@/lib/plan'
import { loadProfile } from '@/lib/sleep/load'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await loadProfile(supabase, user.id)
  const pro = hasPro(profile)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">{user.email}</p>
      </div>

      <WindDownSettings
        targetBedtime={shortTime(profile.target_bedtime) ?? '23:30'}
        windDownMinutes={profile.wind_down_minutes}
        enabled={profile.reminder_enabled}
        timezone={profile.timezone}
        pro={pro}
      />

      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Plan</h2>
          <span className="rounded-full border border-primary/50 bg-primary/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
            {profile.plan === 'pro' ? 'Pro' : limitsEnforced() ? 'Free' : 'Early access'}
          </span>
        </div>
        <div className="mt-4 grid gap-3 text-[13px] sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <p className="font-semibold">Free</p>
            <ul className="mt-2 space-y-1 text-muted">
              <li>Daily logging</li>
              <li>Trend charts for the last 30 days</li>
              <li>A simple suggestion for tonight</li>
            </ul>
          </div>
          <div className="rounded-xl border border-primary/50 bg-primary/10 p-4">
            <p className="font-semibold">Pro · $5 a month</p>
            <ul className="mt-2 space-y-1 text-muted">
              <li>AI pattern analysis of your habits</li>
              <li>Personal coaching for tonight</li>
              <li>Wind-down reminders</li>
              <li>Full history</li>
            </ul>
          </div>
        </div>
        {!limitsEnforced() && (
          <p className="mt-3 text-[12px] text-muted">Everything is open while SleepReset is in early access.</p>
        )}
      </section>

      <DangerZone />
    </div>
  )
}
