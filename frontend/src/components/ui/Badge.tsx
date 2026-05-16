import { routeColor } from '@/utils/colors'

interface BadgeProps {
  routeCode: string
  size?: 'sm' | 'md'
}

export default function Badge({ routeCode, size = 'md' }: BadgeProps) {
  const color = routeColor(routeCode)
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[0.72rem] lg:text-xs fullhd:text-sm' : 'px-3 py-1 text-sm fullhd:text-base 2k:text-lg'

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold tracking-wide text-white shadow-sm ${sizeClass}`}
      style={{ backgroundColor: color }}
    >
      {routeCode}
    </span>
  )
}
