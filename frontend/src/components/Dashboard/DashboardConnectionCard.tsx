import { useState } from 'react'
import type { SavedConnection, Connection } from '@/types/api'
import Badge from '@/components/ui/Badge'
import { waitColor } from './dashboardUtils'

interface Props {
  conn: SavedConnection
  results: Connection[]
  loading: boolean
  onClick: () => void
}

function ConnectionOptionRow({ opt, conn, index }: { opt: Connection; conn: SavedConnection; index: number }) {
  const podiumIcon = ['🥇', '🥈', '🥉'][index]

  return (
    <div className={`rounded-xl border p-3 text-xs transition-all ${
      index < 3
        ? 'border-amber-200/60 bg-amber-50/60 dark:border-amber-700/30 dark:bg-amber-900/10'
        : 'border-slate-200/60 bg-white/50 dark:border-slate-700/40 dark:bg-slate-800/30'
    }`}>
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {podiumIcon ? (
            <span className="text-sm leading-none">{podiumIcon}</span>
          ) : (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[9px] lg:text-[10px] fullhd:text-[11px] 2k:text-xs font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
              {index + 1}
            </span>
          )}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            Opción {index + 1}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] lg:text-[11px] fullhd:text-xs 2k:text-sm font-bold ${
            opt.waitMins <= 5
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
              : opt.waitMins <= 10
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
          }`}>
            {opt.waitMins} min espera
          </span>
          <span className="text-[10px] lg:text-[11px] fullhd:text-xs 2k:text-sm font-medium text-slate-400">
            {opt.totalMins} min total
          </span>
        </div>
      </div>

      {/* 4-stop timeline */}
      <StopTimeline opt={opt} conn={conn} compact />
    </div>
  )
}

/** Shows the 4 stops (board A → alight A → board B → alight B) with times */
function StopTimeline({
  opt,
  conn,
  compact = false,
}: {
  opt: Connection
  conn: SavedConnection
  compact?: boolean
}) {
  const textSize = compact ? 'text-[11px] lg:text-xs fullhd:text-sm 2k:text-base' : 'text-xs lg:text-sm fullhd:text-base 2k:text-lg'
  const dotSize = compact ? 'h-2 w-2 fullhd:h-2.5 fullhd:w-2.5' : 'h-2.5 w-2.5 lg:h-3 lg:w-3 fullhd:h-3.5 fullhd:w-3.5'
  const lineH = compact ? 'h-4 fullhd:h-5' : 'h-5 lg:h-6 fullhd:h-7'
  const gap = compact ? 'gap-1 fullhd:gap-1.5' : 'gap-1.5 lg:gap-2 fullhd:gap-2.5'

  return (
    <div className={`flex items-start ${gap}`}>
      {/* Vertical dots + line */}
      <div className="flex flex-col items-center pt-[3px]">
        <div className={`${dotSize} rounded-full bg-blue-500`} />
        <div className={`${lineH} w-0.5 bg-blue-300/60 dark:bg-blue-700/60`} />
        <div className={`${dotSize} rounded-full bg-blue-300 dark:bg-blue-600`} />
        <div className={`${lineH} w-0.5 bg-amber-300/60 dark:bg-amber-700/40`} />
        <div className={`${dotSize} rounded-full bg-emerald-500`} />
        <div className={`${lineH} w-0.5 bg-emerald-300/60 dark:bg-emerald-700/60`} />
        <div className={`${dotSize} rounded-full bg-emerald-300 dark:bg-emerald-600`} />
      </div>

      {/* Stop info */}
      <div className={`min-w-0 flex-1 ${textSize}`}>
        {/* Board line A */}
        <div className="flex items-center gap-1.5">
          <Badge routeCode={conn.line_a_route_code ?? '?'} size="sm" />
          <span className="font-semibold text-blue-600 dark:text-blue-400">{opt.lineATime}</span>
          <span className="truncate text-slate-600 dark:text-slate-300">
            {conn.origin_stop_name ?? 'Origen'}
          </span>
        </div>

        {/* Alight line A (transfer point) */}
        <div className={`flex items-center gap-1.5 ${lineH}`}>
          <span className="font-medium text-blue-400 dark:text-blue-500">{opt.transferTime}</span>
          <span className="truncate text-slate-500 dark:text-slate-400">
            {conn.transfer_stop_a_name ?? 'Combinación'}
          </span>
        </div>

        {/* Transbordo indicator */}
        <div className={`flex items-center gap-1.5 ${lineH}`}>
          <span className="text-amber-500 dark:text-amber-400">⇄</span>
          <span className="text-[10px] lg:text-[11px] fullhd:text-xs 2k:text-sm font-medium text-amber-600 dark:text-amber-400">
            Transbordo · {opt.waitMins} min
          </span>
        </div>

        {/* Board line B */}
        <div className="flex items-center gap-1.5">
          <Badge routeCode={conn.line_b_route_code ?? '?'} size="sm" />
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{opt.lineBTime}</span>
          <span className="truncate text-slate-600 dark:text-slate-300">
            {conn.board_stop_name ?? 'Subida'}
          </span>
        </div>

        {/* Alight line B (destination) */}
        <div className={`flex items-center gap-1.5 ${lineH}`}>
          <span className="font-medium text-emerald-400 dark:text-emerald-500">{opt.finalTime}</span>
          <span className="truncate text-slate-500 dark:text-slate-400">
            {conn.dest_stop_name ?? 'Destino'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function DashboardConnectionCard({
  conn,
  results,
  loading,
  onClick,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const best = results[0] ?? null
  const hasData = results.length > 0

  const handleToggle = () => {
    if (hasData) setExpanded(v => !v)
  }

  return (
    <div className="w-full rounded-2xl border border-slate-200/70 bg-white/80 text-left shadow-sm transition-all hover:bg-white hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/80">
      {/* Clickable summary */}
      <button
        onClick={handleToggle}
        className="w-full p-3.5 text-left lg:p-4"
        aria-expanded={expanded}
      >
        {/* Header */}
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-lg leading-none lg:text-xl">⟳</span>
            <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100 lg:text-base fullhd:text-lg 2k:text-xl">
              {conn.name}
            </span>
          </div>
          {!loading && hasData && best && (
            <div className="flex shrink-0 items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] lg:text-[11px] fullhd:text-xs 2k:text-sm font-bold ${
                best.waitMins <= 5
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                  : best.waitMins <= 10
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
              }`}>
                {best.waitMins} min espera
              </span>
              <span className="text-[10px] lg:text-[11px] fullhd:text-xs 2k:text-sm font-medium text-slate-400 dark:text-slate-500">
                {best.totalMins} min total
              </span>
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="animate-pulse space-y-2">
            <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        )}

        {/* No data */}
        {!loading && !hasData && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sin servicios disponibles ahora
          </p>
        )}

        {/* Best result: full 4-stop timeline */}
        {!loading && hasData && best && (
          <>
            <StopTimeline opt={best} conn={conn} />

            {/* Wait progress bar */}
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="text-[9px] lg:text-[10px] fullhd:text-[11px] 2k:text-xs text-slate-400">Espera</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (best.waitMins / 20) * 100)}%`,
                    backgroundColor: waitColor(best.waitMins),
                  }}
                />
              </div>
            </div>

            {/* Expand hint */}
            {results.length > 1 && (
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[10px] lg:text-[11px] fullhd:text-xs 2k:text-sm text-slate-400">
                  +{results.length - 1} opción{results.length - 1 !== 1 ? 'es' : ''} más
                </p>
                <svg
                  className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            )}
          </>
        )}
      </button>

      {/* Expanded: all options */}
      {expanded && !loading && results.length > 0 && (
        <div className="space-y-2 border-t border-slate-200/60 px-3.5 pb-3.5 pt-2 dark:border-slate-700/40 lg:px-4 lg:pb-4 lg:pt-3">
          <p className="text-[10px] lg:text-[11px] fullhd:text-xs 2k:text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Todas las opciones
          </p>
          {results.map((opt, i) => (
            <ConnectionOptionRow key={`${opt.lineATime}-${opt.lineBTime}-${i}`} opt={opt} conn={conn} index={i} />
          ))}
          {/* Map button */}
          <button
            onClick={(e) => { e.stopPropagation(); onClick() }}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-[11px] lg:text-xs fullhd:text-sm 2k:text-base font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:bg-slate-700/60"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M3 5h2V3H3v2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2V3h-2zM5 21v-2H3v2h2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8v-2h-2v2h2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2z" />
            </svg>
            Ver en el mapa
          </button>
        </div>
      )}
    </div>
  )
}
