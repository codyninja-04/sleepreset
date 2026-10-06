'use client'

import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART, tooltipStyle } from '@/lib/chart'
import type { Correlation } from '@/lib/types'

interface Row {
  factor: string
  with: number | null
  without: number | null
  with_label: string
  without_label: string
  with_n: number
  without_n: number
}

function TooltipBody({ active, payload }: { active?: boolean; payload?: Array<{ payload: Row }> }) {
  if (!active || !payload?.length) return null
  const r = payload[0].payload
  return (
    <div style={tooltipStyle.contentStyle} className="px-3 py-2">
      <p className="mb-1 font-semibold">{r.factor}</p>
      <p className="flex items-center gap-2 text-[12px] text-text/80">
        <span className="h-2 w-2 rounded-sm" style={{ background: CHART.with }} />
        {r.with_label}: <b className="tabular-nums text-text">{r.with ?? '-'}</b> ({r.with_n} nights)
      </p>
      <p className="flex items-center gap-2 text-[12px] text-text/80">
        <span className="h-2 w-2 rounded-sm" style={{ background: CHART.without }} />
        {r.without_label}: <b className="tabular-nums text-text">{r.without ?? '-'}</b> ({r.without_n} nights)
      </p>
    </div>
  )
}

/**
 * Average sleep quality with and without each habit, side by side. Only
 * factors with enough nights on both sides are drawn, so every bar pair is a
 * real comparison.
 */
export function PersonalPatternChart({ correlations }: { correlations: Correlation[] }) {
  const rows: Row[] = correlations
    .filter((c) => c.with_n >= 3 && c.without_n >= 3)
    .map((c) => ({
      factor: c.factor,
      with: c.with_avg,
      without: c.without_avg,
      with_label: c.with_label,
      without_label: c.without_label,
      with_n: c.with_n,
      without_n: c.without_n,
    }))

  if (!rows.length) return null

  return (
    <section className="card p-5">
      <h2 className="text-base font-semibold">Average sleep quality, with and without</h2>
      <p className="mt-0.5 text-[13px] text-muted">Out of 5. Hover or tap a row for the night counts.</p>

      <div className="mt-4" style={{ height: rows.length * 64 + 48 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 0 }} barGap={2} barCategoryGap={14}>
            <CartesianGrid horizontal={false} stroke={CHART.grid} />
            <XAxis
              type="number"
              domain={[0, 5]}
              ticks={[0, 1, 2, 3, 4, 5]}
              tick={{ fill: CHART.axis, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="factor"
              width={128}
              tick={{ fill: '#CBD5E1', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<TooltipBody />} cursor={{ fill: 'rgb(148 163 184 / 0.08)' }} />
            <Legend
              verticalAlign="top"
              align="left"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: '#CBD5E1', paddingBottom: 8 }}
              formatter={(v) => <span style={{ color: '#CBD5E1' }}>{v}</span>}
            />
            <Bar dataKey="with" name="With the habit" fill={CHART.with} radius={[0, 4, 4, 0]} barSize={10}>
              <LabelList dataKey="with" position="right" fill="#CBD5E1" fontSize={10} />
            </Bar>
            <Bar dataKey="without" name="Without" fill={CHART.without} radius={[0, 4, 4, 0]} barSize={10}>
              <LabelList dataKey="without" position="right" fill="#CBD5E1" fontSize={10} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
