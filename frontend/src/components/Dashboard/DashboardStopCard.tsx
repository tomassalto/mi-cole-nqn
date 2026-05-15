import type { Favorite, Arrival } from '@/types/api'
import { formatHour, statusColor, statusDot } from './dashboardUtils'

interface Props {
  stop: Favorite
  arrivals: Arrival[]
  loading: boolean
  onClick: () => void
}

export default function DashboardStopCard({
  stop,
  arrivals,
  loading,
  onClick,
}: Props) {
  const topArrivals = arrivals.slice(0, 4)

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-slate-200/70 bg-white/80 p-3.5 text-left shadow-sm transition-all hover:bg-white hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/80 lg:p-4"
    >
      {/* Header */}
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-lg leading-none lg:text-xl">★</span>
        <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100 lg:text-base">
          {stop.name}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse items-center gap-3"
            >
              <div className="h-3 w-6 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      )}

      {/* No arrivals */}
      {!loading && topArrivals.length === 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Sin servicios próximos
        </p>
      )}

      {/* Arrival rows */}
      {!loading && topArrivals.length > 0 && (
        <div className="space-y-1.5">
          {topArrivals.map((arrival, i) => (
            <div
              key={`${arrival.serviceId}-${arrival.tripId ?? arrival.scheduledTs}-${i}`}
              className="flex items-center gap-2 text-xs lg:text-sm"
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot(arrival.status)} lg:h-2 lg:w-2`}
              />
              <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200">
                {arrival.routeCode}
              </span>
              <span className="font-medium tabular-nums text-slate-900 dark:text-slate-100">
                {formatHour(arrival.predictedTs ?? arrival.scheduledTs)}
              </span>
              <span className="font-medium text-slate-600 dark:text-slate-400">
                en {arrival.minutesUntil} min
              </span>
              <span className={`ml-auto ${statusColor(arrival.status)}`}>
                {arrival.statusLabel}
              </span>
            </div>
          ))}
        </div>
      )}
    </button>
  )
}
