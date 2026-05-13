// ── Formateo de tiempo ────────────────────────────────────────────────────

export function formatHour(ts: number | null | undefined): string {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatMins(mins: number): string {
  if (mins > 60) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
  return String(mins)
}

export interface ArrivalStatusResult {
  class: 'early' | 'late' | 'ontime' | 'scheduled'
  label: string
  diffMin: number
}

export function getArrivalStatus(
  predicted: number | null | undefined,
  scheduled: number | null | undefined
): ArrivalStatusResult {
  if (!predicted || !scheduled) {
    return { class: 'scheduled', label: 'Horario', diffMin: 0 }
  }
  const diff = predicted - scheduled
  const diffMin = Math.round(diff / 60000)
  if (diffMin <= -1) return { class: 'early', label: `${Math.abs(diffMin)} min antes`, diffMin }
  if (diffMin >= 1) return { class: 'late', label: `${diffMin} min después`, diffMin }
  return { class: 'ontime', label: 'A tiempo', diffMin: 0 }
}

export function minsToDisplay(mins: number): { display: string; label: string } {
  if (mins <= 0) return { display: 'arribando', label: '' }
  if (mins > 60) return { display: formatMins(mins), label: '' }
  return { display: String(mins), label: 'min' }
}
