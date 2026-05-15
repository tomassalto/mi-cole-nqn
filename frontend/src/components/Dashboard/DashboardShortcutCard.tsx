import type { SavedShortcut, ShortcutTrip } from '@/types/api'

interface Props {
  shortcut: SavedShortcut
  trips: ShortcutTrip[]
  loading: boolean
  onClick: () => void
}

export default function DashboardShortcutCard({
  shortcut,
  trips,
  loading,
  onClick,
}: Props) {
  const topTrips = trips.slice(0, 4)

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-slate-200/70 bg-white/80 p-3.5 text-left shadow-sm transition-all hover:bg-white hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/80 lg:p-4"
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-lg leading-none lg:text-xl">⚡</span>
          <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100 lg:text-base">
            {shortcut.name}
          </span>
        </div>
        <span className="shrink-0 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
          {shortcut.line_route_code}
        </span>
      </div>

      {/* Route info */}
      <p className="mb-3 truncate text-xs text-slate-500 dark:text-slate-400">
        {shortcut.origin_stop_name ?? 'Origen'} →{' '}
        {shortcut.dest_stop_name ?? 'Destino'}
      </p>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-4">
              <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      )}

      {/* No trips */}
      {!loading && topTrips.length === 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Sin servicios próximos
        </p>
      )}

      {/* Paired trip rows */}
      {!loading && topTrips.length > 0 && (
        <div className="space-y-2">
          {/* Column headers */}
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
            <span className="w-[68px]">Subida</span>
            <span className="flex-1 text-center">→</span>
            <span className="w-[68px] text-right">Bajada</span>
          </div>

          {topTrips.map((trip, i) => {
            const isSoon = trip.departureMins <= 0
            return (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs ${
                  i === 0
                    ? 'bg-slate-100 font-medium dark:bg-slate-700/50'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {/* Departure */}
                <div className="w-[68px]">
                  <span className={`tabular-nums ${
                    isSoon ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                  }`}>
                    {trip.departureTime}
                  </span>
                  <span className={`ml-1 ${
                    isSoon ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                  }`}>
                    {trip.departureMins > 0 ? `${trip.departureMins}'` : 'ahora'}
                  </span>
                </div>

                {/* Arrow */}
                <div className="flex-1 flex items-center justify-center">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 text-slate-300 dark:text-slate-600">
                    <path d="M8 1L1 8h5v7h4V8h5L8 1z" />
                  </svg>
                  {trip.predicted && (
                    <span className="ml-1 text-[9px] text-emerald-500" title="Tiempo estimado">~</span>
                  )}
                </div>

                {/* Arrival */}
                <div className="w-[68px] text-right">
                  <span className="tabular-nums text-slate-900 dark:text-slate-100">
                    {trip.arrivalTime}
                  </span>
                  <span className="ml-1 text-slate-500">
                    {trip.arrivalMins > 0 ? `${trip.arrivalMins}'` : 'ahora'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </button>
  )
}
