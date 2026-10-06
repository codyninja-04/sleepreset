import { ChartIcon, GearIcon, PenIcon, SparkIcon } from '@/components/ui/Icons'

export const NAV = [
  { href: '/log', label: 'Log', Icon: PenIcon },
  { href: '/insights', label: 'Insights', Icon: SparkIcon },
  { href: '/trends', label: 'Trends', Icon: ChartIcon },
  { href: '/settings', label: 'Settings', Icon: GearIcon },
] as const

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}
