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
  const base = 'inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/40'
  const styles = variant === 'filled'
    ? color ?? 'border-white/20 bg-slate-900 text-white shadow-lg shadow-slate-900/15 dark:bg-slate-700 dark:border-slate-600'
    : 'border-transparent bg-white/70 text-slate-700 hover:border-slate-200 hover:bg-white hover:text-slate-900 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-100'

  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`${base} ${styles} ${className}`}
    >
      {icon}
    </button>
  )
}
