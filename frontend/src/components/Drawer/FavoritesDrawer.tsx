import { useApp } from '@/contexts/AppContext'
import { useMap as useMapCtx } from '@/contexts/MapContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { deleteSavedConnection } from '@/services/savedConnections'
import Badge from '@/components/ui/Badge'
import IconButton from '@/components/ui/IconButton'
import type { MouseEvent } from 'react'

export default function FavoritesDrawer() {
  const { drawerOpen, closeDrawer, savedConnections, refreshSavedConnections } = useApp()
  const { selectStop, showRoute, setActiveDialog, startConnectionCreation } = useMapCtx()
  const { stops, lines, removeStop, removeLine } = useFavorites()

  const handleDeleteConnection = async (e: MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteSavedConnection(id)
    await refreshSavedConnections()
  }

  const handleOpenConnection = (conn: typeof savedConnections[0]) => {
    const origin = { id: conn.origin_stop_id, name: conn.origin_stop_name ?? '', lat: 0, lon: 0 }
    const dest = { id: conn.dest_stop_id, name: conn.dest_stop_name ?? '', lat: 0, lon: 0 }
    setConnectionOrigin(origin)
    setConnectionDest(dest)
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
        className={`fixed inset-0 bg-black/40 z-[700] transition-opacity duration-250 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeDrawer}
      />
      <aside className={`fixed top-0 left-0 bottom-0 w-[300px] max-w-[90vw] bg-white z-[800] flex flex-col shadow-[4px_0_20px_rgba(0,0,0,0.2)] transition-transform duration-250 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-4 bg-[#1565c0] text-white flex-shrink-0">
          <h2 className="text-sm">Paradas guardadas</h2>
          <IconButton icon={<span>✕</span>} onClick={closeDrawer} label="Cerrar" variant="filled" />
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {lines.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Líneas guardadas</div>
              {lines.map(line => (
                <div key={line.id} className="flex items-center gap-2.5 px-4 py-3 cursor-pointer hover:bg-[#f5f7fa] border-b border-[#e5e7eb]"
                  onClick={() => handleSelectLine(line)}>
                  <span className="text-amber-400 text-lg">★</span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Badge routeCode={line.route_code ?? ''} size="sm" />
                    <span className="text-xs text-[#6b7280] truncate">{line.route_name}</span>
                  </div>
                  <IconButton icon={<span className="text-sm opacity-60">✕</span>}
                    onClick={(e: MouseEvent) => { (e as MouseEvent<HTMLButtonElement>).stopPropagation(); removeLine(Number(line.service_id)) }}
                    label="Eliminar" />
                </div>
              ))}
            </>
          )}
          {stops.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Paradas guardadas</div>
              {stops.map(fav => (
                <div key={fav.id} className="flex items-center gap-2.5 px-4 py-3 cursor-pointer hover:bg-[#f5f7fa] border-b border-[#e5e7eb]"
                  onClick={() => handleSelectStop(fav)}>
                  <span className="text-amber-400 text-lg">★</span>
                  <span className="flex-1 text-[0.95rem] truncate">{fav.name}</span>
                  <IconButton icon={<span className="text-sm opacity-60">✕</span>}
                    onClick={(e: MouseEvent) => { (e as MouseEvent<HTMLButtonElement>).stopPropagation(); removeStop(Number(fav.id)) }}
                    label="Eliminar" />
                </div>
              ))}
            </>
          )}
          {stops.length === 0 && lines.length === 0 && savedConnections.length === 0 && (
            <p className="text-[#6b7280] text-sm text-center px-4 py-6">Guardá paradas, líneas o conexiones</p>
          )}
          {savedConnections.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Mis conexiones</div>
              {savedConnections.map(conn => (
                <div key={conn.id} className="flex items-center gap-2.5 px-4 py-3 cursor-pointer hover:bg-[#f5f7fa] border-b border-[#e5e7eb]"
                  onClick={() => handleOpenConnection(conn)}>
                  <span className="text-amber-400 text-lg">⟳</span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-[0.95rem] truncate">{conn.name}</span>
                    <span className="text-xs text-[#6b7280]">{conn.line_a_route_code} → {conn.line_b_route_code}</span>
                  </div>
                  <IconButton icon={<span className="text-sm opacity-60">✕</span>}
                    onClick={(e: MouseEvent) => handleDeleteConnection(e, conn.id)}
                    label="Eliminar" />
                </div>
              ))}
            </>
          )}
        </div>
        {lines.length >= 2 && (
          <div className="px-4 py-3 border-t border-[#e5e7eb] flex-shrink-0">
            <button onClick={() => { closeDrawer(); startConnectionCreation() }}
              className="w-full px-4 py-2.5 bg-[#1565c0] text-white rounded-lg text-sm font-medium hover:bg-[#0d47a1] transition-colors">
              + Nueva conexión
            </button>
          </div>
        )}
      </aside>
    </>
  )
}