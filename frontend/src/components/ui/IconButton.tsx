import type { ReactNode, MouseEvent } from 'react'

interface IconButtonProps {
  icon: ReactNode
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  label: string
  variant?: 'ghost' | 'filled'
  color?: string
  className?: string
}

export default function IconButton({
  icon,
  onClick,
  label,
  variant = 'ghost',
  color,
  className = '',
}: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
        variant === 'filled' ? color ?? 'bg-white/15 text-white' : 'text-[#6b7280] hover:bg-[#f5f7fa]'
      } ${className}`}
    >
      {icon}
    </button>
  )
}