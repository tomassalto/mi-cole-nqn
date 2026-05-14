import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useMap as useMapCtx } from '@/contexts/MapContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { deleteSavedConnection } from '@/services/savedConnections'
import { deleteSavedShortcut } from '@/services/savedShortcuts'
import {
  subscribePush,
  unsubscribePush,
  getActivePushShortcuts,
  setActivePush,
  clearActivePush,
} from '@/services/push'
import Badge from '@/components/ui/Badge'
import IconButton from '@/components/ui/IconButton'
import NotificationSetupModal from '@/components/Dialogs/NotificationSetupModal'
import type { MouseEvent } from 'react'

export default function FavoritesDrawer() {
  const {
    drawerOpen,
    closeDrawer,
    savedConnections,
    refreshSavedConnections,
    savedShortcuts,
    refreshSavedShortcuts,
  } = useApp()
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

  // Push notification modal state
  const [notifModal, setNotifModal] = useState<{
    shortcutId: string
    shortcutName: string
  } | null>(null)
  const [activePush, setActivePushState] = useState<Record<string, number>>(
    () => getActivePushShortcuts()
  )

  const handleDeleteConnection = async (e: MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteSavedConnection(id)
    await refreshSavedConnections()
  }

  const handleDeleteShortcut = async (e: MouseEvent, id: string) => {
    e.stopPropagation()
    // Remove any push subscription first
    if (activePush[id] != null) {
      await unsubscribePush(id).catch(() => null)
      clearActivePush(id)
      setActivePushState(getActivePushShortcuts())
    }
    await deleteSavedShortcut(id)
    await refreshSavedShortcuts()
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

  const handleBellClick = (e: MouseEvent, id: string, name: string) => {
    e.stopPropagation()
    setNotifModal({ shortcutId: id, shortcutName: name })
  }

  const handleNotifConfirm = async (minutesThreshold: number) => {
    if (!notifModal) return
    const { shortcutId } = notifModal
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        alert('Necesitás permitir las notificaciones en tu navegador para activar esta función.')
        setNotifModal(null)
        return
      }
      await subscribePush(shortcutId, minutesThreshold)
      setActivePush(shortcutId, minutesThreshold)
      setActivePushState(getActivePushShortcuts())
    } catch (err) {
      console.error('Push subscribe error:', err)
      alert('No se pudo activar la notificación. Revisá los permisos del navegador.')
    }
    setNotifModal(null)
  }

  const handleNotifDisable = async () => {
    if (!notifModal) return
    const { shortcutId } = notifModal
    try {
      await unsubscribePush(shortcutId)
      clearActivePush(shortcutId)
      setActivePushState(getActivePushShortcuts())
    } catch (err) {
      console.error('Push unsubscribe error:', err)
    }
    setNotifModal(null)
  }

  return (
    <>
      {notifModal && (
        <NotificationSetupModal
          shortcutName={notifModal.shortcutName}
          currentThreshold={activePush[notifModal.shortcutId] ?? null}
          onConfirm={handleNotifConfirm}
          onDisable={handleNotifDisable}
          onClose={() => setNotifModal(null)}
        />
      )}

      <div
        className={`fixed inset-0 z-[700] bg-slate-950/35 transition-opacity duration-300 ${drawerOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={closeDrawer}
      />
      <aside className={`fixed bottom-0 left-0 top-0 z-[800] flex w-[320px] max-w-[92vw] flex-col overflow-hidden border-r border-white/70 bg-white/92 shadow-[18px_0_50px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-transform duration-300 dark:border-slate-700/70 dark:bg-slate-900/95 dark:shadow-[18px_0_50px_rgba(0,0,0,0.40)] ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-4 dark:border-slate-700/80">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Guardados</h2>
          <IconButton icon={<span>✕</span>} onClick={closeDrawer} label="Cerrar" variant="filled" />
        </div>
        <div className="flex-1 overflow-y-auto py-2">

          {/* Atajos */}
          {savedShortcuts.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Mis atajos</div>
              {savedShortcuts.map(shortcut => {
                const isActive = activePush[shortcut.id] != null
                return (
                  <div
                    key={shortcut.id}
                    className="flex cursor-pointer items-center gap-2.5 border-b border-slate-200/70 px-4 py-3 transition-colors hover:bg-slate-50 dark:border-slate-700/70 dark:hover:bg-slate-800"
                  >
                    <span className="text-emerald-500 text-lg">⚡</span>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[0.92rem] font-medium text-slate-900 dark:text-slate-100">{shortcut.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {shortcut.line_route_code} · {shortcut.origin_stop_name ?? 'Origen'} → {shortcut.dest_stop_name ?? 'Destino'}
                      </span>
                    </div>
                    <button
                      onClick={(e: MouseEvent) => handleBellClick(e, shortcut.id, shortcut.name)}
                      title={isActive ? `Notificación activa: ${activePush[shortcut.id]} min` : 'Activar notificación'}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-base transition-colors ${
                        isActive
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-600 dark:border-emerald-500/50 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'border-slate-200 bg-transparent text-slate-400 hover:border-slate-300 hover:text-slate-600 dark:border-slate-700 dark:text-slate-500 dark:hover:border-slate-500 dark:hover:text-slate-300'
                      }`}
                    >
                      {isActive ? '🔔' : '🔕'}
                    </button>
                    <IconButton
                      icon={<span className="text-sm opacity-60">✕</span>}
                      onClick={(e: MouseEvent) => handleDeleteShortcut(e, shortcut.id)}
                      label="Eliminar atajo"
                    />
                  </div>
                )
              })}
            </>
          )}

          {/* Líneas */}
          {lines.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Lineas guardadas</div>
              {lines.map(line => (
                <div
                  key={line.id}
                  className="flex cursor-pointer items-center gap-2.5 border-b border-slate-200/70 px-4 py-3 transition-colors hover:bg-slate-50 dark:border-slate-700/70 dark:hover:bg-slate-800"
                  onClick={() => handleSelectLine(line)}
                >
                  <span className="text-amber-400 text-lg">★</span>
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <Badge routeCode={line.route_code ?? ''} size="sm" />
                    <span className="truncate text-xs text-slate-500 dark:text-slate-400">{line.route_name}</span>
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

          {/* Paradas */}
          {stops.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Paradas guardadas</div>
              {stops.map(fav => (
                <div
                  key={fav.id}
                  className="flex cursor-pointer items-center gap-2.5 border-b border-slate-200/70 px-4 py-3 transition-colors hover:bg-slate-50 dark:border-slate-700/70 dark:hover:bg-slate-800"
                  onClick={() => handleSelectStop(fav)}
                >
                  <span className="text-amber-400 text-lg">★</span>
                  <span className="min-w-0 flex-1 truncate text-[0.95rem] text-slate-900 dark:text-slate-100">{fav.name}</span>
                  <IconButton
                    icon={<span className="text-sm opacity-60">✕</span>}
                    onClick={(e: MouseEvent) => { e.stopPropagation(); removeStop(Number(fav.id)) }}
                    label="Eliminar"
                  />
                </div>
              ))}
            </>
          )}

          {/* Conexiones */}
          {savedConnections.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Mis conexiones</div>
              {savedConnections.map(conn => (
                <div
                  key={conn.id}
                  className="flex cursor-pointer items-center gap-2.5 border-b border-slate-200/70 px-4 py-3 transition-colors hover:bg-slate-50 dark:border-slate-700/70 dark:hover:bg-slate-800"
                  onClick={() => handleOpenConnection(conn)}
                >
                  <span className="text-amber-400 text-lg">⟳</span>
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="truncate text-[0.95rem] text-slate-900 dark:text-slate-100">{conn.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{conn.line_a_route_code} {'→'} {conn.line_b_route_code}</span>
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

          {stops.length === 0 && lines.length === 0 && savedConnections.length === 0 && savedShortcuts.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">Guardá paradas, lineas, atajos o conexiones</p>
          )}
        </div>

        <div className="border-t border-slate-200/80 p-4 dark:border-slate-700/80">
          <button
            onClick={() => { closeDrawer(); startShortcutCreation() }}
            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
          >
            + Crear atajo
          </button>
        </div>
        {lines.length >= 1 && (
          <div className="border-t border-slate-200/80 p-4 dark:border-slate-700/80">
            <button
              onClick={() => { closeDrawer(); startConnectionCreation() }}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              + Nueva conexión
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
