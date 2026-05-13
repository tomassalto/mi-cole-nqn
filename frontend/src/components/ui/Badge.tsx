import { routeColor } from '@/utils/colors'

interface BadgeProps {
  routeCode: string
  size?: 'sm' | 'md'
}

export default function Badge({ routeCode, size = 'md' }: BadgeProps) {
  const color = routeColor(routeCode)
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-base px-2 py-1'

  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl font-extrabold text-white ${sizeClass}`}
      style={{ backgroundColor: color }}
    >
      {routeCode}
    </span>
  )
}