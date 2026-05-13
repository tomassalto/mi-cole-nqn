import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode
} from 'react'
import type { Stop, Vehicle, RouteShape } from '@/types/api'
import { getStopsAll, getRouteShape } from '@/services/stops'

function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = []
  let idx = 0, lat = 0, lng = 0
  while (idx < encoded.length) {
    let shift = 0, result = 0, byte: number
    do { byte = encoded.charCodeAt(idx++) - 63; result |= (byte & 0x1f) << shift; shift += 5 } while (byte >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1
    shift = result = 0
    do { byte = encoded.charCodeAt(idx++) - 63; result |= (byte & 0x1f) << shift; shift += 5 } while (byte >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1
    coords.push([lat / 1e5, lng / 1e5])
  }
  return coords
}

type ConnectionCreationStep = 'idle' | 'selectOrigin' | 'selectLineA' | 'selectCombination' | 'selectLineB' | 'selectDest' | 'fillName'

interface ConnectionCreationData {
  originStop: Stop | null
  lineAServiceId: number | null
  lineARouteCode: string
  combinationStop: Stop | null
  lineBServiceId: number | null
  lineBRouteCode: string
  destStop: Stop | null
}

interface MapContextValue {
  selectedStop: Stop | null
  stops: Stop[]
  vehicles: Vehicle[]
  routeCoords: [number, number][]
  routeStopIds: Set<number> | null
  etaMode: boolean
  activeDialog: 'none' | 'eta' | 'connection'
  connectionOrigin: Stop | null
  connectionDest: Stop | null
  connectionCreationStep: ConnectionCreationStep
  connectionCreationData: ConnectionCreationData
  selectStop: (stop: Stop | null) => void
  showRoute: (serviceId: number | string) => Promise<void>
  clearRoute: () => void
  updateVehicles: (vehicles: Vehicle[]) => void
  setEtaMode: (active: boolean) => void
  setActiveDialog: (d: 'none' | 'eta' | 'connection') => void
  setConnectionOrigin: (s: Stop | null) => void
  setConnectionDest: (s: Stop | null) => void
  startConnectionCreation: () => void
  setConnectionCreationStep: (step: ConnectionCreationStep) => void
  updateConnectionCreationData: (data: Partial<ConnectionCreationData>) => void
  cancelConnectionCreation: () => void
}

const MapContext = createContext<MapContextValue | null>(null)

export function MapProvider({ children }: { children: ReactNode }) {
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null)
  const [stops, setStops] = useState<Stop[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null)
  const [routeStopIds, setRouteStopIds] = useState<Set<number> | null>(null)
  const [etaMode, setEtaModeState] = useState(false)
  const [activeDialog, setActiveDialog] = useState<'none' | 'eta' | 'connection'>('none')
  const [connectionOrigin, setConnectionOrigin] = useState<Stop | null>(null)
  const [connectionDest, setConnectionDest] = useState<Stop | null>(null)
  const [connectionCreationStep, setConnectionCreationStep] = useState<ConnectionCreationStep>('idle')
  const [connectionCreationData, setConnectionCreationData] = useState<ConnectionCreationData>({
    originStop: null,
    lineAServiceId: null,
    lineARouteCode: '',
    combinationStop: null,
    lineBServiceId: null,
    lineBRouteCode: '',
    destStop: null,
  })

  useEffect(() => {
    getStopsAll()
      .then(s => { console.log('[MapContext] stops loaded:', s.length); setStops(s) })
      .catch(err => { console.error('[MapContext] stops error:', err); setStops([]) })
  }, [])

  const showRoute = useCallback(async (serviceId: number | string) => {
    try {
      const shape: RouteShape = await getRouteShape(Number(serviceId))
      if (shape.encoded) setRouteCoords(decodePolyline(shape.encoded))
      if (shape.stops?.length) setRouteStopIds(new Set(shape.stops))
    } catch {
      setRouteCoords(null)
      setRouteStopIds(null)
    }
  }, [])

  const clearRoute = useCallback(() => {
    setRouteCoords(null)
    setRouteStopIds(null)
  }, [])

  const selectStop = useCallback((stop: Stop | null) => setSelectedStop(stop), [])
  const updateVehicles = useCallback((v: Vehicle[]) => setVehicles(v), [])
  const setEtaMode = useCallback((active: boolean) => setEtaModeState(active), [])

  const startConnectionCreation = useCallback(() => {
    setConnectionCreationStep('selectOrigin')
    setConnectionCreationData({
      originStop: null,
      lineAServiceId: null,
      lineARouteCode: '',
      combinationStop: null,
      lineBServiceId: null,
      lineBRouteCode: '',
      destStop: null,
    })
    setActiveDialog('connection')
  }, [setActiveDialog])

  const updateConnectionCreationData = useCallback((data: Partial<ConnectionCreationData>) => {
    setConnectionCreationData(prev => ({ ...prev, ...data }))
  }, [])

  const cancelConnectionCreation = useCallback(() => {
    setConnectionCreationStep('idle')
    setConnectionCreationData({
      originStop: null,
      lineAServiceId: null,
      lineARouteCode: '',
      combinationStop: null,
      lineBServiceId: null,
      lineBRouteCode: '',
      destStop: null,
    })
  }, [])

  return (
    <MapContext.Provider value={{
      selectedStop,
      stops,
      vehicles,
      routeCoords: routeCoords ?? [],
      routeStopIds,
      etaMode,
      activeDialog,
      connectionOrigin,
      connectionDest,
      connectionCreationStep,
      connectionCreationData,
      showRoute,
      clearRoute,
      selectStop,
      updateVehicles,
      setEtaMode,
      setActiveDialog,
      setConnectionOrigin,
      setConnectionDest,
      startConnectionCreation,
      setConnectionCreationStep,
      updateConnectionCreationData,
      cancelConnectionCreation,
    }}>
      {children}
    </MapContext.Provider>
  )
}

export function useMap(): MapContextValue {
  const ctx = useContext(MapContext)
  if (!ctx) throw new Error('useMap must be used inside MapProvider')
  return ctx
}