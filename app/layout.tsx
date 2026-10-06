import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'SleepReset',
    template: '%s · SleepReset',
  },
  description:
    'Log your nights and daily habits in under a minute, and find out which of your own habits actually change how well you sleep.',
  applicationName: 'SleepReset',
  appleWebApp: { capable: true, title: 'SleepReset', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
}

export const viewport: Viewport = {
  themeColor: '#0F172A',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans text-text antialiased">{children}</body>
    </html>
  )
}
