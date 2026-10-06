import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { TonightCard } from '@/components/coaching/TonightCard'
import { NightPicker } from '@/components/log/NightPicker'
import { RecentNights } from '@/components/log/RecentNights'
import { SleepLogForm } from '@/components/log/SleepLogForm'
import { addDays, defaultNight, isDateString, todayIn } from '@/lib/dates'
import { loadLogs, loadProfile } from '@/lib/sleep/load'
import { typicalTimes } from '@/lib/sleep/stats'
import { createClient } from '@/lib/supabase/server'
import type { SleepLog } from '@/lib/types'

export const metadata: Metadata = { title: 'Log' }

export default async function LogPage({ searchParams }: { searchParams: { date?: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await loadProfile(supabase, user.id)
  const today = todayIn(profile.timezone)
  const requested = searchParams.date
  const date = isDateString(requested) && requested <= today ? requested : defaultNight(profile.timezone)

  const logs = await loadLogs(supabase, user.id, { since: addDays(today, -30) })
  let current = logs.find((l) => l.sleep_date === date) ?? null
  if (!current && date < addDays(today, -30)) {
    const { data } = await supabase.from('sleep_logs').select('*').eq('user_id', user.id).eq('sleep_date', date).maybeSingle()
    current = (data as SleepLog | null) ?? null
  }

  const suggested = typicalTimes(logs.filter((l) => l.sleep_date !== date))

  return (
    <div className="space-y-5">
      <NightPicker date={date} today={today} />
      <RecentNights logs={logs} today={today} selected={date} />
      <TonightCard refreshKey={logs.find((l) => l.sleep_date === today)?.updated_at} />
      <SleepLogForm key={date} date={date} isTonight={date === today} initial={current} suggested={suggested} />
    </div>
  )
}
