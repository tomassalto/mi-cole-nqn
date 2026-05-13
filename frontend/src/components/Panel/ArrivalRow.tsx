import type { Arrival } from '@/types/api'
import IconButton from '@/components/ui/IconButton'
import Badge from '@/components/ui/Badge'

interface ArrivalRowProps {
  arrival: Arrival
  isLineFavorited: boolean
  onRowClick: () => void
  onShowRoute: () => void
  onToggleFav: () => void
}

const STATUS_COLORS: Record<string, string> = {
  early: 'text-[#dc2626]',
  late: 'text-[#2563eb]',
  ontime: 'text-[#16a34a]',
  scheduled: 'text-[#9ca3af]',
}

function formatMins(mins: number): { display: string; label: string } {
  if (mins <= 0) return { display: 'arribando', label: '' }
  if (mins > 60) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return { display: m > 0 ? `${h}h ${m}m` : `${h}h`, label: '' }
  }
  return { display: String(mins), label: 'min' }
}

function formatHour(ts: number | null): string {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

export default function ArrivalRow({ arrival, isLineFavorited, onRowClick, onShowRoute, onToggleFav }: ArrivalRowProps) {
  const { display, label } = formatMins(arrival.minutesUntil)
  const hourStr = formatHour(arrival.predictedTs ?? arrival.scheduledTs)
  const color = STATUS_COLORS[arrival.status] ?? ''

  return (
    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[#e5e7eb] hover:bg-[#f5f7fa] active:bg-[#f5f7fa] transition-colors" onClick={onRowClick}>
      <IconButton
        icon={<span className="text-lg">{isLineFavorited ? '★' : '☆'}</span>}
        onClick={(e) => { e.stopPropagation(); onToggleFav() }}
        label={isLineFavorited ? 'Quitar de líneas guardadas' : 'Guardar línea'}
        className={isLineFavorited ? 'text-amber-400' : 'text-[#6b7280]'}
      />
      <Badge routeCode={arrival.routeCode} />
      <div className="flex-1 min-w-0">
        <div className="text-[0.95rem] font-medium truncate">{arrival.routeName}</div>
        <div className={`text-[0.7rem] font-medium uppercase tracking-wide ${color}`}>
          {arrival.statusLabel}
        </div>
      </div>
      <div className="flex flex-col items-end flex-shrink-0 min-w-[70px]">
        <span className={`text-[1.5rem] font-bold leading-none ${color}`}>{display}</span>
        {label && <span className="text-[0.65rem] text-[#6b7280]">{label}</span>}
        <span className={`text-[0.85rem] font-semibold mt-1 ${color}`}>{hourStr}</span>
      </div>
      <IconButton
        icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>}
        onClick={(e) => { e.stopPropagation(); onShowRoute() }}
        label="Ver recorrido"
      />
    </div>
  )
}