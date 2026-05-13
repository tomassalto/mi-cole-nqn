import { useState } from 'react'
import { useMap as useMapCtx } from '@/contexts/MapContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useToast as useToastCtx } from '@/contexts/ToastContext'
import { useArrivals } from '@/hooks/useArrivals'
import { useSchedule } from '@/hooks/useSchedule'
import IconButton from '@/components/ui/IconButton'
import ArrivalRow from './ArrivalRow'
import ScheduleView from './ScheduleView'

export default function ArrivalsPanel() {
  const { selectedStop, selectStop, showRoute, clearRoute, routeStopIds, setActiveDialog } = useMapCtx()
  const { isLineFavorited, addLine, removeLine, addStop, removeStop, isStopFavorited } = useFavorites()
  const { show } = useToastCtx()
  const [view, setView] = useState<'arrivals' | 'schedule'>('arrivals')
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)

  const stopId = selectedStop ? Number(selectedStop.id) : null
  const { arrivals, loading, error } = useArrivals(stopId)
  const { stops: scheduleStops } = useSchedule(
    selectedTripId,
    selectedStop ? Number(selectedStop.id) : null
  )

  if (!selectedStop) return null

  const handleRowClick = async (arrival: typeof arrivals[0]) => {
    await showRoute(Number(arrival.serviceId))
    if (arrival.tripId) {
      setSelectedTripId(arrival.tripId)
      setView('schedule')
    }
  }

  const handleToggleStopFav = async () => {
    if (isStopFavorited(Number(selectedStop.id))) {
      await removeStop(Number(selectedStop.id))
      show('Parada eliminada')
    } else {
      await addStop(selectedStop)
      show('Parada guardada')
    }
  }

  const handleToggleLineFav = async (serviceId: number, routeCode: string, routeName: string, add: boolean) => {
    if (add) { await addLine(serviceId, routeCode, routeName); show(`Línea ${routeCode} guardada`) }
    else { await removeLine(serviceId); show(`Línea ${routeCode} eliminada`) }
  }

  const handleClearFilter = () => clearRoute()
  const handleClose = () => selectStop(null)
  const handleBack = () => { setView('arrivals'); setSelectedTripId(null) }

  return (
    <div className="fixed left-0 right-0 bottom-0 bg-white rounded-t-xl shadow-[0_-4px_20px_rgba(0,0,0,0.18)] z-[500] flex flex-col transition-transform duration-250 max-h-[80vh] overflow-hidden
      md:left-0 md:top-[52px] md:bottom-0 md:right-auto md:w-80 md:rounded-none md:translate-x-0 md:shadow-[4px_0_20px_rgba(0,0,0,0.12)] md:flex-col md:max-h-none">
      {/* Drag handle */}
      <div className="w-10 h-1 bg-[#e5e7eb] rounded mx-auto my-2.5 flex-shrink-0 md:hidden" />
      {/* Header */}
      <div className="flex items-start justify-between px-4 pb-2.5 flex-shrink-0 border-b border-[#e5e7eb]">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold truncate">{selectedStop.name}</h2>
          {selectedStop.code && <span className="text-xs text-[#6b7280]">Parada {selectedStop.code}</span>}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {routeStopIds && (
            <IconButton
              icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3 5h2V3H3v2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2V3h-2zM5 21v-2H3v2h2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8v-2h-2v2h2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2z"/></svg>}
              onClick={handleClearFilter}
              label="Ver todas las paradas"
            />
          )}
          <IconButton
            icon={<span className="text-lg">{isStopFavorited(Number(selectedStop.id)) ? '★' : '☆'}</span>}
            onClick={handleToggleStopFav}
            label={isStopFavorited(Number(selectedStop.id)) ? 'Quitar de favoritos' : 'Guardar parada'}
            className={isStopFavorited(Number(selectedStop.id)) ? 'text-amber-400' : ''}
          />
          <IconButton icon={<span>✕</span>} onClick={handleClose} label="Cerrar panel" />
        </div>
      </div>
      {/* Content */}
      {view === 'arrivals' ? (
        <div className="flex-1 overflow-y-auto py-2">
          {loading && <p className="text-[#6b7280] text-sm text-center px-4 py-6">Cargando llegadas…</p>}
          {error && <p className="text-red-600 text-sm text-center px-4 py-6">Error: {error}</p>}
          {!loading && !error && arrivals.length === 0 && <p className="text-[#6b7280] text-sm text-center px-4 py-6">No hay llegadas próximas.</p>}
          {!loading && !error && arrivals.map(arrival => {
            const serviceId = Number(arrival.serviceId)
            const fav = isLineFavorited(serviceId)
            return (
              <ArrivalRow
                key={`${arrival.serviceId}-${arrival.tripId ?? arrival.scheduledTs}`}
                arrival={arrival}
                isLineFavorited={fav}
                onRowClick={() => handleRowClick(arrival)}
                onShowRoute={() => showRoute(serviceId)}
                onToggleFav={() => handleToggleLineFav(serviceId, arrival.routeCode, arrival.routeName, !fav)}
              />
            )
          })}
        </div>
      ) : (
        <ScheduleView
          stops={scheduleStops}
          title={arrivals.find(a => a.tripId === selectedTripId)
            ? `${arrivals.find(a => a.tripId === selectedTripId)?.routeCode} · ${arrivals.find(a => a.tripId === selectedTripId)?.routeName}`
            : 'Horario'}
          onBack={handleBack}
        />
      )}
      {/* ETA button */}
      {view === 'arrivals' && (
        <div className="px-4 py-3 border-t border-[#e5e7eb] flex-shrink-0">
          <button onClick={() => setActiveDialog('eta')} className="w-full px-4 py-2.5 bg-[#f5f7fa] border border-[#e5e7eb] rounded-lg text-sm text-[#1565c0] font-medium hover:bg-blue-50 transition-colors">
            ¿A qué hora llego a otra parada?
          </button>
        </div>
      )}
    </div>
  )
}