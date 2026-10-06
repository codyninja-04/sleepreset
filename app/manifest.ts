import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SleepReset',
    short_name: 'SleepReset',
    description: 'Find out which of your own habits change how well you sleep.',
    start_url: '/log',
    display: 'standalone',
    background_color: '#0F172A',
    theme_color: '#0F172A',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  }
}
