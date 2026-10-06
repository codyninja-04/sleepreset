import webpush from 'web-push'

let configured = false

export function pushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
}

function configure() {
  if (configured) return
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:hello@sleepreset.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  configured = true
}

export interface StoredSubscription {
  endpoint: string
  p256dh: string
  auth: string
}

/** Returns 'gone' when the push service says the subscription no longer exists. */
export async function sendPush(
  sub: StoredSubscription,
  payload: { title: string; body: string; url?: string }
): Promise<'sent' | 'gone' | 'failed'> {
  configure()
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 4 }
    )
    return 'sent'
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode
    if (status === 404 || status === 410) return 'gone'
    console.error('push failed', status)
    return 'failed'
  }
}
