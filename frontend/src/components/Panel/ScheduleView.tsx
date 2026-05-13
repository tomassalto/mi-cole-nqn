import type { TripStop } from '@/types/api'

interface ScheduleViewProps {
  stops: TripStop[]
  title: string
  onBack: () => void
}

export default function ScheduleView({ stops, title, onBack }: ScheduleViewProps) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#e5e7eb] flex-shrink-0">
        <button onClick={onBack} className="text-[#6b7280] text-xl px-2 py-1 rounded hover:bg-[#f5f7fa] transition-colors">←</button>
        <span className="font-semibold text-sm truncate">{title}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {stops.map((stop, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-2.5 border-b border-[#e5e7eb] ${stop.isCurrent ? 'bg-blue-50' : ''}`}>
            <span className={`font-semibold text-[0.88rem] tabular-nums min-w-[42px] flex-shrink-0 ${stop.isCurrent ? 'text-blue-700' : ''}`}>
              {stop.time}
            </span>
            <span className={`text-[0.85rem] truncate ${stop.isCurrent ? 'text-blue-700 font-medium' : 'text-[#6b7280]'}`}>
              {stop.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}