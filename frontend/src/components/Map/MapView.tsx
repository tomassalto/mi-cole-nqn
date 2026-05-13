import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap, Marker, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMap as useMapCtx } from '@/contexts/MapContext'

const DEFAULT_CENTER: [number, number] = [-38.9516, -68.0591]
const DEFAULT_ZOOM = 15

function createStopIcon(selected: boolean) {
  return L.divIcon({
    className: '',
    html: `<div class="stop-marker${selected ? ' selected' : ''}"></div>`,
    iconSize: selected ? [18, 18] : [14, 14],
    iconAnchor: selected ? [9, 9] : [7, 7],
  })
}

function createBusIcon(routeCode: string) {
  const svg = `<svg class="bam-svg" viewBox="-5.5 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 22.281v-13.563c0-0.438 0.25-1 0.594-1.344 0.094-0.094 0.219-0.156 0.313-0.219h0.031c1.5-1.156 3.469-2 5.719-2.469 1.188-0.219 2.438-0.344 3.75-0.344s2.563 0.125 3.75 0.344c2.25 0.469 4.219 1.313 5.719 2.469h0.031c0.094 0.063 0.188 0.125 0.281 0.219 0.344 0.344 0.625 0.906 0.625 1.344v13.563c0 1-0.688 1.781-1.594 2v1.813c0 0.844-0.688 1.563-1.531 1.563-0.875 0-1.563-0.719-1.563-1.563v-1.75h-11.438v1.75c0 0.844-0.719 1.563-1.563 1.563-0.875 0-1.563-0.719-1.563-1.563v-1.813c-0.906-0.219-1.563-1-1.563-2z" fill="#1a1a1a"/>
    <path d="M3.125 17.063h14.531c0.563 0 1.031-0.5 1.031-1.063v-5.156c0-0.563-0.469-1.063-1.031-1.063h-14.531c-0.563 0-1 0.5-1 1.063v5.156c0 0.563 0.438 1.063 1 1.063z" fill="#fff"/>
  </svg>`
  return L.divIcon({
    className: 'bus-arrival-marker',
    html: `<div class="flex flex-col items-center justify-center">${svg}<span class="bam-route-code font-black">${routeCode}</span></div>`,
    iconSize: [24, 38],
    iconAnchor: [12, 38],
  })
}

function MapEvents() {
  const map = useMap()
  const { setEtaMode } = useMapCtx()

  useEffect(() => {
    const handler = (e: Event) => setEtaMode((e as CustomEvent<boolean>).detail)
    document.addEventListener('micole:setEtamode', handler)
    return () => document.removeEventListener('micole:setEtamode', handler)
  }, [setEtaMode])

  useEffect(() => {
    const container = map.getContainer()
    const updateCursor = (e: Event) => {
      container.style.cursor = (e as CustomEvent<boolean>).detail ? 'crosshair' : ''
    }
    document.addEventListener('micole:setEtamode', updateCursor)
    return () => document.removeEventListener('micole:setEtamode', updateCursor)
  }, [map])

  return null
}

export default function MapView() {
  const { selectedStop, selectStop, stops, vehicles, routeCoords, routeStopIds, etaMode, activeDialog, connectionOrigin, setConnectionOrigin, setConnectionDest, connectionCreationStep, setConnectionCreationStep, updateConnectionCreationData } = useMapCtx()

  const visibleStops = routeStopIds
    ? stops.filter(s => routeStopIds.has(s.id))
    : stops

  const isSelectingForConnection = activeDialog === 'connection' && connectionCreationStep !== 'idle'

  const handleMarkerClick = (stop: typeof stops[0]) => {
    if (isSelectingForConnection) {
      if (connectionCreationStep === 'selectOrigin') {
        updateConnectionCreationData({ originStop: stop })
        setConnectionCreationStep('selectLineA')
      } else if (connectionCreationStep === 'selectCombination') {
        updateConnectionCreationData({ combinationStop: stop })
        setConnectionCreationStep('selectLineB')
      } else if (connectionCreationStep === 'selectDest') {
        updateConnectionCreationData({ destStop: stop })
      }
      return
    }
    if (activeDialog === 'connection' && etaMode) {
      if (!connectionOrigin) {
        setConnectionOrigin(stop)
      } else {
        setConnectionDest(stop)
      }
    } else if (!etaMode) {
      selectStop(stop)
    }
  }

  return (
    <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="fixed top-[52px] left-0 right-0 bottom-0 z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <MapEvents />
      {visibleStops.map(stop => (
        <Marker
          key={stop.id}
          position={[stop.lat, stop.lon]}
          icon={createStopIcon(selectedStop?.id === stop.id)}
          eventHandlers={{ click: () => handleMarkerClick(stop) }}
        />
      ))}
      {vehicles.map(veh => (
        <Marker
          key={veh.id}
          position={[veh.lat, veh.lon]}
          icon={createBusIcon(veh.routeCode)}
          zIndexOffset={100}
        />
      ))}
      {routeCoords && routeCoords.length > 0 && (
        <Polyline positions={routeCoords} pathOptions={{ color: '#1a1a1a', weight: 5, opacity: 0.85 }} />
      )}
    </MapContainer>
  )
}