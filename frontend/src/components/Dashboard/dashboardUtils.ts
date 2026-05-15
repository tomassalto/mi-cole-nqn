export function formatHour(ts: number | null | undefined): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function statusColor(status: string): string {
  switch (status) {
    case 'early':
      return 'text-red-600 dark:text-red-400'
    case 'late':
      return 'text-blue-600 dark:text-blue-400'
    case 'ontime':
      return 'text-emerald-600 dark:text-emerald-400'
    default:
      return 'text-slate-400 dark:text-slate-500'
  }
}

export function statusDot(status: string): string {
  switch (status) {
    case 'early':
      return 'bg-red-500'
    case 'late':
      return 'bg-blue-500'
    case 'ontime':
      return 'bg-emerald-500'
    default:
      return 'bg-slate-400'
  }
}

export function waitColor(minutes: number): string {
  if (minutes <= 5) return '#10b981'
  if (minutes <= 10) return '#f59e0b'
  return '#ef4444'
}
