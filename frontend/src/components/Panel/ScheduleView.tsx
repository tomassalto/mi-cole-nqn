import type { TripStop } from '@/types/api'

interface ScheduleViewProps {
  stops: TripStop[]
  title: string
  onBack: () => void
}

export default function ScheduleView({ stops, title, onBack }: ScheduleViewProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-200/80 px-4 py-3">
        <button onClick={onBack} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 transition-colors hover:bg-slate-50">←</button>
        <span className="truncate text-sm font-semibold text-slate-900">{title}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {stops.map((stop, i) => (
          <div key={i} className={`flex items-center gap-3 border-b border-slate-200/60 px-4 py-2.5 ${stop.isCurrent ? 'bg-emerald-50/80' : ''}`}>
            <span className={`min-w-[46px] flex-shrink-0 font-semibold tabular-nums text-[0.88rem] ${stop.isCurrent ? 'text-emerald-700' : 'text-slate-700'}`}>
              {stop.time}
            </span>
            <span className={`truncate text-[0.86rem] ${stop.isCurrent ? 'font-medium text-emerald-800' : 'text-slate-500'}`}>
              {stop.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
