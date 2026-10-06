import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'
import { TimezoneSync } from '@/components/layout/TimezoneSync'
import { loadProfile } from '@/lib/sleep/load'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await loadProfile(supabase, user.id)
  const name = profile.display_name || (user.user_metadata?.full_name as string | undefined) || null

  return (
    <div className="min-h-screen">
      <Header name={name} />
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-6 sm:px-6 md:pb-16">{children}</main>
      <BottomNav />
      <TimezoneSync saved={profile.timezone} />
    </div>
  )
}
