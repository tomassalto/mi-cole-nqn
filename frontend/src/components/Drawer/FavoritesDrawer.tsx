import { useApp } from '@/contexts/AppContext'
import { useMap as useMapCtx } from '@/contexts/MapContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { deleteSavedConnection } from '@/services/savedConnections'
import Badge from '@/components/ui/Badge'
import IconButton from '@/components/ui/IconButton'
import type { MouseEvent } from 'react'

export default function FavoritesDrawer() {
  const { drawerOpen, closeDrawer, savedConnections, refreshSavedConnections } = useApp()
  const {
    selectStop,
    showRoute,
    setActiveDialog,
    startConnectionCreation,
    startShortcutCreation,
    setConnectionCreationStep,
    updateConnectionCreationData,
  } = useMapCtx()
  const { stops, lines, removeStop, removeLine } = useFavorites()

  const handleDeleteConnection = async (e: MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteSavedConnection(id)
    await refreshSavedConnections()
  }

  const handleOpenConnection = (conn: typeof savedConnections[0]) => {
    updateConnectionCreationData({
      originStop: { id: conn.origin_stop_id, name: conn.origin_stop_name ?? '', lat: 0, lon: 0 },
      combinationStop: { id: conn.transfer_stop_a_id ?? conn.origin_stop_id, name: conn.transfer_stop_a_name ?? '', lat: 0, lon: 0 },
      boardStop: { id: conn.board_stop_id ?? conn.dest_stop_id, name: conn.board_stop_name ?? '', lat: 0, lon: 0 },
      destStop: { id: conn.dest_stop_id, name: conn.dest_stop_name ?? '', lat: 0, lon: 0 },
      lineAServiceId: conn.line_a_service_id,
      lineARouteCode: conn.line_a_route_code ?? '',
      lineBServiceId: conn.line_b_service_id,
      lineBRouteCode: conn.line_b_route_code ?? '',
    })
    setConnectionCreationStep('viewSaved')
    setActiveDialog('connection')
    closeDrawer()
  }

  const handleEditConnection = (conn: typeof savedConnections[0], e: MouseEvent) => {
    e.stopPropagation()
    updateConnectionCreationData({
      originStop: { id: conn.origin_stop_id, name: conn.origin_stop_name ?? '', lat: 0, lon: 0 },
      combinationStop: { id: conn.transfer_stop_a_id ?? conn.origin_stop_id, name: conn.transfer_stop_a_name ?? '', lat: 0, lon: 0 },
      boardStop: { id: conn.board_stop_id ?? conn.dest_stop_id, name: conn.board_stop_name ?? '', lat: 0, lon: 0 },
      destStop: { id: conn.dest_stop_id, name: conn.dest_stop_name ?? '', lat: 0, lon: 0 },
      lineAServiceId: conn.line_a_service_id,
      lineARouteCode: conn.line_a_route_code ?? '',
      lineBServiceId: conn.line_b_service_id,
      lineBRouteCode: conn.line_b_route_code ?? '',
    })
    setConnectionCreationStep('fillName')
    setActiveDialog('connection')
    closeDrawer()
  }

  const handleSelectStop = (fav: typeof stops[0]) => {
    if (fav.lat != null && fav.lon != null) {
      selectStop({ id: Number(fav.id), name: fav.name, lat: fav.lat, lon: fav.lon })
    }
    closeDrawer()
  }

  const handleSelectLine = (line: typeof lines[0]) => {
    if (line.service_id != null) showRoute(Number(line.service_id))
    closeDrawer()
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-[700] bg-slate-950/35 transition-opacity duration-300 ${drawerOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={closeDrawer}
      />
      <aside className={`fixed bottom-0 left-0 top-0 z-[800] flex w-[320px] max-w-[92vw] flex-col overflow-hidden border-r border-white/70 bg-white/92 shadow-[18px_0_50px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Paradas guardadas</h2>
          <IconButton icon={<span>✕</span>} onClick={closeDrawer} label="Cerrar" variant="filled" />
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {lines.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Lineas guardadas</div>
              {lines.map(line => (
                <div
                  key={line.id}
                  className="flex cursor-pointer items-center gap-2.5 border-b border-slate-200/70 px-4 py-3 transition-colors hover:bg-slate-50"
                  onClick={() => handleSelectLine(line)}
                >
                  <span className="text-amber-400 text-lg">★</span>
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <Badge routeCode={line.route_code ?? ''} size="sm" />
                    <span className="truncate text-xs text-slate-500">{line.route_name}</span>
                  </div>
                  <IconButton
                    icon={<span className="text-sm opacity-60">✕</span>}
                    onClick={(e: MouseEvent) => { e.stopPropagation(); removeLine(Number(line.service_id)) }}
                    label="Eliminar"
                  />
                </div>
              ))}
            </>
          )}
          {stops.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Paradas guardadas</div>
              {stops.map(fav => (
                <div
                  key={fav.id}
                  className="flex cursor-pointer items-center gap-2.5 border-b border-slate-200/70 px-4 py-3 transition-colors hover:bg-slate-50"
                  onClick={() => handleSelectStop(fav)}
                >
                  <span className="text-amber-400 text-lg">★</span>
                  <span className="min-w-0 flex-1 truncate text-[0.95rem] text-slate-900">{fav.name}</span>
                  <IconButton
                    icon={<span className="text-sm opacity-60">✕</span>}
                    onClick={(e: MouseEvent) => { e.stopPropagation(); removeStop(Number(fav.id)) }}
                    label="Eliminar"
                  />
                </div>
              ))}
            </>
          )}
          {stops.length === 0 && lines.length === 0 && savedConnections.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-500">Guardá paradas, lineas o conexiones</p>
          )}
          {savedConnections.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Mis conexiones</div>
              {savedConnections.map(conn => (
                <div
                  key={conn.id}
                  className="flex cursor-pointer items-center gap-2.5 border-b border-slate-200/70 px-4 py-3 transition-colors hover:bg-slate-50"
                  onClick={() => handleOpenConnection(conn)}
                >
                  <span className="text-amber-400 text-lg">⟳</span>
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="truncate text-[0.95rem] text-slate-900">{conn.name}</span>
                    <span className="text-xs text-slate-500">{conn.line_a_route_code} {'→'} {conn.line_b_route_code}</span>
                  </div>
                  <IconButton
                    icon={<span className="text-sm">🔎</span>}
                    onClick={(e: MouseEvent) => { e.stopPropagation(); handleOpenConnection(conn) }}
                    label="Ver recomendación"
                  />
                  <IconButton
                    icon={<span className="text-sm">✎</span>}
                    onClick={(e: MouseEvent) => handleEditConnection(conn, e)}
                    label="Editar conexión"
                  />
                  <IconButton
                    icon={<span className="text-sm opacity-60">✕</span>}
                    onClick={(e: MouseEvent) => handleDeleteConnection(e, conn.id)}
                    label="Eliminar"
                  />
                </div>
              ))}
            </>
          )}
        </div>
        <div className="border-t border-slate-200/80 p-4">
          <button
            onClick={() => { closeDrawer(); startShortcutCreation() }}
            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            + Crear atajo
          </button>
        </div>
        {lines.length >= 1 && (
          <div className="border-t border-slate-200/80 p-4">
            <button
              onClick={() => { closeDrawer(); startConnectionCreation() }}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              + Nueva conexión
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
