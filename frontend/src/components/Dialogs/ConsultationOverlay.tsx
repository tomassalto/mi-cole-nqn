import { useEffect, useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { calculateConnections } from '@/services/connections'
import { calculateShortcutTrips } from '@/services/shortcuts'
import type { Connection } from '@/types/api'

type ConsultationMap = Record<string, Connection[]>
type ShortcutConsultationMap = Record<string, Awaited<ReturnType<typeof calculateShortcutTrips>>>

export default function ConsultationOverlay() {
  const { consultationOpen, closeConsultation, savedConnections, savedShortcuts } = useApp()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ConsultationMap>({})
  const [shortcutResults, setShortcutResults] = useState<ShortcutConsultationMap>({})

  useEffect(() => {
    if (!consultationOpen) {
      setResults({})
      setShortcutResults({})
      setLoading(false)
      return
    }

    let cancelled = false

    const run = async () => {
      setLoading(true)
      try {
        const connectionRows = await Promise.all(
          savedConnections.map(async conn => {
            const originStopId = Number(conn.origin_stop_id)
            const transferStopAId = Number(conn.transfer_stop_a_id ?? conn.origin_stop_id)
            const boardStopId = Number(conn.board_stop_id ?? conn.dest_stop_id)
            const destStopId = Number(conn.dest_stop_id)

            if (!originStopId || !transferStopAId || !boardStopId || !destStopId || !conn.line_a_service_id || !conn.line_b_service_id) {
              return [conn.id, []] as const
            }

            try {
              const items = await calculateConnections(
                originStopId,
                transferStopAId,
                boardStopId,
                destStopId,
                conn.line_a_service_id,
                conn.line_b_service_id
              )
              return [conn.id, items] as const
            } catch {
              return [conn.id, []] as const
            }
          })
        )

        const shortcutRows = await Promise.all(
          savedShortcuts.map(async shortcut => {
            try {
              const items = await calculateShortcutTrips(
                Number(shortcut.origin_stop_id),
                Number(shortcut.dest_stop_id),
                Number(shortcut.line_service_id),
                shortcut.line_route_code ?? undefined
              )
              return [shortcut.id, items] as const
            } catch {
              return [shortcut.id, []] as const
            }
          })
        )

        if (!cancelled) {
          setResults(Object.fromEntries(connectionRows))
          setShortcutResults(Object.fromEntries(shortcutRows))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [consultationOpen, savedConnections, savedShortcuts])

  if (!consultationOpen) return null

  return (
    <div className="fixed inset-0 z-[1150]">
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-md"
        onClick={closeConsultation}
      />
      <section className="absolute inset-0 flex flex-col">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/60 px-4 py-4 text-white backdrop-blur-xl">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Consulta rápida</p>
            <h2 className="text-base font-semibold">Próximos 5 viajes</h2>
          </div>
          <button
            onClick={closeConsultation}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
            aria-label="Cerrar consulta"
            title="Cerrar consulta"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {savedConnections.length === 0 && (
            <div className="mx-auto mt-12 max-w-md rounded-[28px] border border-white/10 bg-white/8 px-5 py-6 text-center text-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
              <p className="text-base font-medium">No hay recorridos guardados.</p>
              <p className="mt-2 text-sm text-white/70">Guardá una conexión para consultar sus próximos viajes desde acá.</p>
            </div>
          )}

          <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
            {savedShortcuts.map(shortcut => {
              const items = shortcutResults[shortcut.id] ?? []
              return (
                <article key={shortcut.id} className="overflow-hidden rounded-[28px] border border-emerald-200/70 bg-white/94 shadow-[0_24px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-4 border-b border-emerald-100 bg-emerald-50/70 px-4 py-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Atajo</p>
                      <h3 className="truncate text-base font-semibold text-slate-900">{shortcut.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {shortcut.line_route_code ?? 'Linea'} {'→'} {shortcut.origin_stop_name ?? 'Origen'} {'→'} {shortcut.dest_stop_name ?? 'Destino'}
                      </p>
                    </div>
                    <div className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                      {items.length > 0 ? `${items.length} viajes` : 'Sin viajes'}
                    </div>
                  </div>

                  <div className="px-4 py-4">
                    {loading && items.length === 0 ? (
                      <p className="text-sm text-slate-500">Calculando próximos viajes...</p>
                    ) : items.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        No hay viajes compatibles en este momento.
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {items.map((item, index) => (
                          <div key={`${shortcut.id}-${item.departureTime}-${item.arrivalTime}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-900">Viaje {index + 1}</p>
                              <p className="text-xs font-medium text-slate-500">Sale en {item.departureMins} min</p>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sale</p>
                                <p className="font-medium text-slate-900">{item.departureTime}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Llega</p>
                                <p className="font-medium text-slate-900">{item.arrivalTime}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
            {savedConnections.map(conn => {
              const items = results[conn.id] ?? []
              return (
                <article key={conn.id} className="overflow-hidden rounded-[28px] border border-white/12 bg-white/92 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-4 py-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Trayecto</p>
                      <h3 className="truncate text-base font-semibold text-slate-900">{conn.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {conn.line_a_route_code ?? 'Linea A'} {'→'} {conn.line_b_route_code ?? 'Linea B'}
                      </p>
                    </div>
                    <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                      {items.length > 0 ? `${items.length} opciones` : 'Sin resultados'}
                    </div>
                  </div>

                  <div className="px-4 py-4">
                    {loading && items.length === 0 ? (
                      <p className="text-sm text-slate-500">Calculando próximos viajes...</p>
                    ) : items.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        No hay combinaciones compatibles en este momento.
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {items.map((item, index) => (
                          <div key={`${conn.id}-${item.lineATime}-${item.lineBTime}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-900">Opción {index + 1}</p>
                              <p className="text-xs font-medium text-slate-500">Espera {item.waitMins} min</p>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sube</p>
                                <p className="font-medium text-slate-900">{item.lineATime}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Baja</p>
                                <p className="font-medium text-slate-900">{item.finalTime || item.lineBTime}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Transbordo</p>
                                <p className="font-medium text-slate-900">{item.transferTime}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Línea B</p>
                                <p className="font-medium text-slate-900">{item.lineBTime}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
