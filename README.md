# SleepReset

A sleep tracker that skips the wearable and looks at your habits instead. You log last night (bedtime, wake time, how it felt, how often you woke) and the day before it (caffeine after 2pm, screens before bed, exercise and when, stress, alcohol, naps). After about two weeks it shows which of *your* habits actually line up with better or worse sleep, and the one change worth trying first.

Built for people in Singapore's always on work culture, where sleep slowly gets worse and nobody connects it to the 4pm kopi or the hour of scrolling in bed.

## Stack

- Next.js 14 (App Router, installable PWA), TypeScript strict
- Supabase Postgres with RLS, Google sign in through Supabase Auth
- Claude (`claude-sonnet-5-5` by default, override with `CLAUDE_MODEL`) for explaining patterns and tonight's suggestion
- Recharts for the trend and comparison charts
- Web Push for the wind-down reminder, sent from a GitHub Actions cron
- Tailwind CSS

## How the analysis works

The important bit is that the numbers do not come from the model.

1. `lib/sleep/correlations.ts` takes every night with a quality rating and splits it into "with" and "without" for each habit: late caffeine, screens over a threshold (it tries 30m, 60m, 90m and 2h and keeps the clearest split that still has enough nights on both sides), exercise, evening versus earlier workouts, high versus low stress, alcohol, naps, and bedtimes more than 45 minutes off your usual.
2. For each one it works out the average quality on both sides, the night counts, average time in bed, and the strongest label the data can honestly support. A comparison needs at least 3 nights on each side to count at all, and "strong" needs a gap of at least 0.8 stars, a decent effect size, 5 or more nights per side and 14 nights total.
3. Claude gets those stats plus the raw nights and writes the explanation and the top recommendation. It can lower a strength (for example when two habits always happen together) but code clamps it so it can never raise one.
4. If Claude is not configured or the call fails, a plain numbers write up is saved instead, so the page still works.

Insights unlock after 10 rated nights. A fresh analysis is reused for 6 hours unless new nights have been logged.

## Logging model

`sleep_date` is the evening the night started. The habit columns on that row describe the same day. So one row reads "what I did, then how I slept", which is what the correlations need.

A night can be saved half done. In the evening the log page opens on tonight, so you can enter the day's habits before bed. In the morning it opens on last night, so you can add the sleep part. Only nights with a quality rating feed the analysis.

## Pages

- `/log` the nightly form, a 7 night strip to spot gaps, and tonight's suggestion
- `/insights` top recommendation, the with and without chart, and a card per factor
- `/trends` quality with a 7 night average, time in bed, bedtime against your target, stat tiles and a table view
- `/settings` target bedtime, wind-down length, reminders, plan, CSV export, account deletion

## API

| Route | What it does |
| --- | --- |
| `GET/POST/DELETE /api/sleep-logs` | List (free accounts limited to 30 days), upsert one night, delete one night |
| `POST /api/insights/analyze` | Recompute stats and run the Claude analysis |
| `GET /api/coaching/tonight` | Tonight's suggestion, cached per day and refreshed when today's habits change |
| `PATCH /api/profile` | Timezone, target bedtime, wind-down length |
| `POST/DELETE /api/push/subscribe` | Register or remove a device for reminders |
| `GET /api/cron/wind-down` | Sends due reminders, needs `Authorization: Bearer $CRON_SECRET` |
| `GET /api/export` | All nights as CSV |
| `DELETE /api/account` | Deletes the user, everything cascades |

## Setup

1. `npm install`
2. Create a Supabase project and run `supabase/migrations/001_initial_schema.sql`
3. Turn on the Google provider in Supabase Auth and add `http://localhost:3000/auth/callback` (and your production URL) to the redirect list
4. Copy `.env.example` to `.env.local` and fill it in. Generate VAPID keys with `npx web-push generate-vapid-keys`
5. `npm run dev`

### Reminders

Vercel Hobby crons only run once a day, so reminders run from `.github/workflows/wind-down.yml` every 15 minutes. Add the repo secrets `APP_URL` and `CRON_SECRET`, and set the repo variable `REMINDERS_ENABLED` to `true`. Because scheduled GitHub runs often start late, anyone whose wind-down started within the last hour is due, and `last_reminded_on` makes sure nobody gets two in one night.

### Pro

Billing is not wired up yet. All Pro features (AI analysis, AI coaching, reminders, full history) are open unless `ENFORCE_PRO=true`. Users cannot change their own `plan`, a trigger blocks it unless the write comes from the service role.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Not in scope

No diagnosis of sleep apnea or any other sleep disorder, and no wearable integration in v1.
