import type { Config } from 'tailwindcss'

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: token('background'),
        surface: token('surface'),
        subtle: token('subtle'),
        border: token('border'),
        primary: token('primary'),
        'primary-soft': token('primary-soft'),
        good: token('good'),
        poor: token('poor'),
        strong: token('strong'),
        moderate: token('moderate'),
        weak: token('weak'),
        text: token('text'),
        muted: token('muted'),
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 rgb(255 255 255 / 0.03) inset, 0 8px 24px -12px rgb(2 6 23 / 0.6)',
        glow: '0 0 0 1px rgb(99 102 241 / 0.35), 0 12px 40px -12px rgb(99 102 241 / 0.45)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.25' },
          '50%': { opacity: '0.9' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'rise-in': 'rise-in 320ms ease-out both',
        twinkle: 'twinkle 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
