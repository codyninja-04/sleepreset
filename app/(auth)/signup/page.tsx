import Link from 'next/link'
import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/AuthShell'
import { GoogleButton } from '@/components/auth/GoogleButton'

export const metadata: Metadata = { title: 'Create an account' }

export default function SignupPage() {
  return (
    <AuthShell
      title="Start with last night"
      subtitle="One quick log each morning. After about two weeks you will see which of your habits actually move your sleep."
    >
      <GoogleButton next="/log" label="Sign up with Google" />
      <p className="text-center text-[13px] text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-text underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
