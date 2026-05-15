import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode
} from 'react'
import type { Stop, Vehicle, RouteShape } from '@/types/api'
import { getStopsAll } from '@/services/stops'
import { getRouteShape } from '@/services/routes'

function computeBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => d * Math.PI / 180
  const φ1 = toRad(lat1), φ2 = toRad(lat2), Δλ = toRad(lon2 - lon1)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

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

type ConnectionCreationStep =
  | 'idle'
  | 'selectOrigin'
  | 'selectLineA'
  | 'selectCombination'
  | 'selectLineB'
  | 'selectBoardStop'
  | 'selectDest'
  | 'viewSaved'
  | 'editStops'
  | 'fillName'

type ShortcutCreationStep =
  | 'idle'
  | 'selectLine'
  | 'selectOrigin'
  | 'selectDest'
  | 'fillName'

interface ConnectionCreationData {
  originStop: Stop | null
  lineAServiceId: number | null
  lineARouteCode: string
  combinationStop: Stop | null
  lineBServiceId: number | null
  lineBRouteCode: string
  boardStop: Stop | null
  destStop: Stop | null
}

interface ShortcutCreationData {
  lineServiceId: number | null
  lineRouteCode: string
  originStop: Stop | null
  destStop: Stop | null
}

interface MapContextValue {
  selectedStop: Stop | null
  stops: Stop[]
  vehicles: Vehicle[]
  routeCoords: [number, number][]
  routeStopIds: Set<number> | null
  routeColor: string | null
  routeHeadings: Map<number, number> | null
  etaMode: boolean
  activeDialog: 'none' | 'eta' | 'connection' | 'shortcut'
  connectionOrigin: Stop | null
  connectionDest: Stop | null
  connectionCreationStep: ConnectionCreationStep
  connectionCreationData: ConnectionCreationData
  shortcutCreationStep: ShortcutCreationStep
  shortcutCreationData: ShortcutCreationData
  selectStop: (stop: Stop | null) => void
  showRoute: (serviceId: number | string) => Promise<void>
  clearRoute: () => void
  updateVehicles: (vehicles: Vehicle[]) => void
  setEtaMode: (active: boolean) => void
  setActiveDialog: (d: 'none' | 'eta' | 'connection' | 'shortcut') => void
  setConnectionOrigin: (s: Stop | null) => void
  setConnectionDest: (s: Stop | null) => void
  startConnectionCreation: () => void
  setConnectionCreationStep: (step: ConnectionCreationStep) => void
  updateConnectionCreationData: (data: Partial<ConnectionCreationData>) => void
  cancelConnectionCreation: () => void
  startShortcutCreation: () => void
  setShortcutCreationStep: (step: ShortcutCreationStep) => void
  updateShortcutCreationData: (data: Partial<ShortcutCreationData>) => void
  cancelShortcutCreation: () => void
}

const MapContext = createContext<MapContextValue | null>(null)

const emptyConnectionData = (): ConnectionCreationData => ({
  originStop: null,
  lineAServiceId: null,
  lineARouteCode: '',
  combinationStop: null,
  lineBServiceId: null,
  lineBRouteCode: '',
  boardStop: null,
  destStop: null,
})

const emptyShortcutData = (): ShortcutCreationData => ({
  lineServiceId: null,
  lineRouteCode: '',
  originStop: null,
  destStop: null,
})

export function MapProvider({ children }: { children: ReactNode }) {
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null)
  const [stops, setStops] = useState<Stop[]>([])
  const stopsRef = useRef<Stop[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null)
  const [routeStopIds, setRouteStopIds] = useState<Set<number> | null>(null)
  const [routeColor, setRouteColor] = useState<string | null>(null)
  const [routeHeadings, setRouteHeadings] = useState<Map<number, number> | null>(null)
  const [etaMode, setEtaModeState] = useState(false)
  const [activeDialog, setActiveDialog] = useState<'none' | 'eta' | 'connection' | 'shortcut'>('none')
  const [connectionOrigin, setConnectionOrigin] = useState<Stop | null>(null)
  const [connectionDest, setConnectionDest] = useState<Stop | null>(null)
  const [connectionCreationStep, setConnectionCreationStep] = useState<ConnectionCreationStep>('idle')
  const [connectionCreationData, setConnectionCreationData] = useState<ConnectionCreationData>(emptyConnectionData())
  const [shortcutCreationStep, setShortcutCreationStep] = useState<ShortcutCreationStep>('idle')
  const [shortcutCreationData, setShortcutCreationData] = useState<ShortcutCreationData>(emptyShortcutData())

  useEffect(() => {
    getStopsAll()
      .then(s => { stopsRef.current = s; setStops(s) })
      .catch(() => { setStops([]) })
  }, [])

  const showRoute = useCallback(async (serviceId: number | string) => {
    try {
      const shape: RouteShape = await getRouteShape(Number(serviceId))
      if (shape.encoded) setRouteCoords(decodePolyline(shape.encoded))
      if (shape.stops?.length) {
        setRouteStopIds(new Set(shape.stops))

        // Usar headings de la API si los hay, si no calcular desde coordenadas
        if (shape.headings?.length === shape.stops.length) {
          const hMap = new Map<number, number>()
          shape.stops.forEach((stopId, i) => hMap.set(stopId, shape.headings[i]))
          setRouteHeadings(hMap)
        } else {
          const stopMap = new Map(stopsRef.current.map(s => [s.id, s]))
          const hMap = new Map<number, number>()
          for (let i = 0; i < shape.stops.length; i++) {
            const curr = stopMap.get(shape.stops[i])
            const next = shape.stops.slice(i + 1).map(id => stopMap.get(id)).find(s => s != null)
            if (curr && next) {
              hMap.set(shape.stops[i], computeBearing(curr.lat, curr.lon, next.lat, next.lon))
            }
          }
          if (hMap.size > 0) setRouteHeadings(hMap)
        }
      }
      setRouteColor(shape.color ?? null)
    } catch {
      setRouteCoords(null)
      setRouteStopIds(null)
      setRouteColor(null)
      setRouteHeadings(null)
    }
  }, [])

  const clearRoute = useCallback(() => {
    setRouteCoords(null)
    setRouteStopIds(null)
    setRouteColor(null)
    setRouteHeadings(null)
  }, [])

  const selectStop = useCallback((stop: Stop | null) => setSelectedStop(stop), [])
  const updateVehicles = useCallback((v: Vehicle[]) => setVehicles(v), [])
  const setEtaMode = useCallback((active: boolean) => setEtaModeState(active), [])

  const startConnectionCreation = useCallback(() => {
    setConnectionCreationStep('selectOrigin')
    setConnectionCreationData(emptyConnectionData())
    setActiveDialog('connection')
  }, [setActiveDialog])

  const updateConnectionCreationData = useCallback((data: Partial<ConnectionCreationData>) => {
    setConnectionCreationData(prev => ({ ...prev, ...data }))
  }, [])

  const cancelConnectionCreation = useCallback(() => {
    setConnectionCreationStep('idle')
    setConnectionCreationData(emptyConnectionData())
  }, [])

  const startShortcutCreation = useCallback(() => {
    setShortcutCreationStep('selectOrigin')
    setShortcutCreationData(emptyShortcutData())
    setActiveDialog('shortcut')
  }, [])

  const updateShortcutCreationData = useCallback((data: Partial<ShortcutCreationData>) => {
    setShortcutCreationData(prev => ({ ...prev, ...data }))
  }, [])

  const cancelShortcutCreation = useCallback(() => {
    setShortcutCreationStep('idle')
    setShortcutCreationData(emptyShortcutData())
  }, [])

  return (
    <MapContext.Provider value={{
      selectedStop,
      stops,
      vehicles,
      routeCoords: routeCoords ?? [],
      routeStopIds,
      routeColor,
      routeHeadings,
      etaMode,
      activeDialog,
      connectionOrigin,
      connectionDest,
      connectionCreationStep,
      connectionCreationData,
      shortcutCreationStep,
      shortcutCreationData,
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
      startShortcutCreation,
      setShortcutCreationStep,
      updateShortcutCreationData,
      cancelShortcutCreation,
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
