/**
 * Chart colours. The two comparison hues were checked with a colour vision
 * deficiency validator against the dark surface (#1E293B): normal vision
 * delta E 24.5, worst CVD delta E 20.3. Text never uses these, only marks.
 */
export const CHART = {
  with: '#6366F1',
  without: '#0F9F8F',
  quality: '#818CF8',
  duration: '#0F9F8F',
  average: '#E2E8F0',
  grid: 'rgb(51 65 85 / 0.6)',
  axis: '#94A3B8',
  surface: '#1E293B',
} as const

export const tooltipStyle = {
  contentStyle: {
    background: '#0F172A',
    border: '1px solid #334155',
    borderRadius: 12,
    fontSize: 12,
    color: '#E2E8F0',
    boxShadow: '0 8px 24px -8px rgb(2 6 23 / 0.8)',
  },
  labelStyle: { color: '#E2E8F0', fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: '#CBD5E1', padding: 0 },
} as const
