'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART, tooltipStyle } from '@/lib/chart'
import { formatClock, formatDuration, offsetToTime } from '@/lib/dates'

export interface TrendPoint {
  date: string
  label: string
  quality: number | null
  rolling: number | null
  hours: number | null
  /** Minutes after 6pm, so bedtimes either side of midnight sit on one line */
  bed_offset: number | null
}

const axis = { tick: { fill: CHART.axis, fontSize: 11 }, axisLine: false, tickLine: false } as const

function tickInterval(n: number) {
  return n <= 14 ? 1 : n <= 31 ? 4 : Math.ceil(n / 8)
}

function Card({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-0.5 text-[13px] text-muted">{hint}</p>
      <div className="mt-4 h-56">{children}</div>
    </section>
  )
}

/**
 * Three small charts instead of one busy one. Quality and time in bed have
 * different scales, so they never share an axis.
 */
export function SleepQualityChart({ points, targetOffset }: { points: TrendPoint[]; targetOffset: number | null }) {
  const interval = tickInterval(points.length)
  const beds = points.filter((p) => p.bed_offset !== null)
  const bedMin = beds.length ? Math.min(...beds.map((p) => p.bed_offset as number), targetOffset ?? Infinity) : 240
  const bedMax = beds.length ? Math.max(...beds.map((p) => p.bed_offset as number), targetOffset ?? -Infinity) : 420
  const lo = Math.floor((bedMin - 30) / 60) * 60
  const hi = Math.ceil((bedMax + 30) / 60) * 60
  const bedTicks = Array.from({ length: (hi - lo) / 60 + 1 }, (_, i) => lo + i * 60)
  const indexed = points.map((p, i) => ({ ...p, i }))

  return (
    <div className="space-y-4">
      <Card title="Sleep quality" hint="Each night out of 5, with your 7 night average.">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="label" interval={interval - 1} {...axis} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} {...axis} />
            <Tooltip
              {...tooltipStyle}
              cursor={{ stroke: CHART.axis, strokeDasharray: '3 3' }}
              formatter={(v: number, name: string) => [v ?? '-', name]}
            />
            <Legend
              verticalAlign="top"
              align="left"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
              formatter={(v) => <span style={{ color: '#CBD5E1' }}>{v}</span>}
            />
            <Line
              type="monotone"
              dataKey="quality"
              name="Night"
              stroke={CHART.quality}
              strokeOpacity={0.45}
              strokeWidth={1.5}
              dot={{ r: 4, fill: CHART.quality, stroke: CHART.surface, strokeWidth: 2 }}
              activeDot={{ r: 6, stroke: CHART.surface, strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="rolling"
              name="7 night average"
              stroke={CHART.average}
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Time in bed" hint="Hours between lights out and waking up.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="label" interval={interval - 1} {...axis} />
            <YAxis domain={[0, 'dataMax + 1']} allowDecimals={false} {...axis} />
            <ReferenceLine y={7} stroke={CHART.axis} strokeDasharray="4 4" label={{ value: '7h', fill: CHART.axis, fontSize: 10, position: 'right' }} />
            <Tooltip
              {...tooltipStyle}
              cursor={{ fill: 'rgb(148 163 184 / 0.08)' }}
              formatter={(v: number) => [formatDuration(Math.round(v * 60)), 'In bed']}
            />
            <Bar dataKey="hours" fill={CHART.duration} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card
        title="Bedtime"
        hint={targetOffset !== null ? `Lights out each night. The dashed line is your target, ${formatClock(offsetToTime(targetOffset))}.` : 'Lights out each night.'}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis
              type="number"
              dataKey="i"
              domain={[-0.5, points.length - 0.5]}
              ticks={indexed.filter((_, i) => i % interval === 0).map((p) => p.i)}
              tickFormatter={(i: number) => points[i]?.label ?? ''}
              {...axis}
            />
            <YAxis
              type="number"
              dataKey="bed_offset"
              domain={[lo, hi]}
              ticks={bedTicks}
              reversed
              tickFormatter={(v: number) => formatClock(offsetToTime(v))}
              width={52}
              {...axis}
            />
            {targetOffset !== null && <ReferenceLine y={targetOffset} stroke={CHART.axis} strokeDasharray="4 4" />}
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: CHART.axis }}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as (TrendPoint & { i: number }) | undefined
                if (!active || !p || p.bed_offset === null) return null
                return (
                  <div style={tooltipStyle.contentStyle} className="px-3 py-2">
                    <p className="font-semibold">{p.label}</p>
                    <p className="text-[12px] text-text/80">Lights out {formatClock(offsetToTime(p.bed_offset))}</p>
                  </div>
                )
              }}
            />
            <Scatter data={indexed.filter((p) => p.bed_offset !== null)} fill={CHART.quality} stroke={CHART.surface} strokeWidth={2} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
