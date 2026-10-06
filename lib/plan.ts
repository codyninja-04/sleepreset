import type { Profile } from './types'

/** Free accounts see this many days of history on the trends page. */
export const FREE_HISTORY_DAYS = 30

/**
 * Billing is not wired up yet, so Pro gates stay open unless ENFORCE_PRO=true.
 * Every gate goes through here so switching them on is one env var.
 */
export function limitsEnforced(): boolean {
  return process.env.ENFORCE_PRO === 'true'
}

export function hasPro(profile: Pick<Profile, 'plan'>): boolean {
  return !limitsEnforced() || profile.plan === 'pro'
}

export const PRO_REQUIRED = 'Pattern analysis, wind-down reminders and full history are part of Pro.'
