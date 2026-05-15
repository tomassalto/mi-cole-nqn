import { useEffect, useMemo } from 'react'
import type { Arrival } from '@/types/api'
import type { VisionbloArrivalsResponse } from '@/types/visionblo'

interface SelectedStop {
  id: number
  name: string
  code?: string
  lat: number
  lon: number
}

interface Vehicle {
  id: string
  lat: number
  lon: number
  routeCode: string
  serviceId: string
  minutesUntil: number
  arriving: boolean
  time: string
  bearing: number | undefined
}

/**
 * Manages vehicle WebSocket subscriptions and position updates for a selected stop.
 * Extracts the ~90-line WebSocket effect that was previously in ArrivalsPanel.
 */
export function useVehicles(
  arrivals: Arrival[],
  raw: VisionbloArrivalsResponse | null,
  selectedStop: SelectedStop | null,
  updateVehicles: (vehicles: Vehicle[]) => void,
) {
  // Build a lookup: vehicleId → { routeCode, routeName }
  const arrivalLookup = useMemo(() => {
    const map = new Map<string, { routeCode: string; routeName: string }>()
    for (const arrival of arrivals) {
      if (!arrival.vehicleId) continue
      if (!map.has(arrival.vehicleId)) {
        map.set(arrival.vehicleId, {
          routeCode: arrival.routeCode,
          routeName: arrival.routeName,
        })
      }
    }
    return map
  }, [arrivals])

  useEffect(() => {
    let cancelled = false

    // Vehicle IDs come from arrivals that have a vehicleId
    const vehicleIds = arrivals
      .filter((a) => a.vehicleId)
      .map((a) => a.vehicleId as string)
    // Also include IDs from references.vehicles
    const refIds = Object.keys(raw?.references?.vehicles ?? {})
    const allIds = [...new Set([...vehicleIds, ...refIds])]

    if (!selectedStop || allIds.length === 0) {
      updateVehicles([])
      return () => { cancelled = true }
    }

    // Vehicles start without positions — they'll get populated via WebSocket
    const baseVehicles = new Map(
      allIds.map((id) => [
        id,
        {
          id,
          lat: 0,
          lon: 0,
          routeCode: arrivalLookup.get(id)?.routeCode ?? '',
          serviceId: '',
          minutesUntil: 0,
          arriving: false,
          time: '',
          bearing: undefined as number | undefined,
        },
      ]),
    )

    const syncSnapshot = () => {
      if (cancelled) return
      // Only push vehicles that have a position and a known route
      const withPosition = [...baseVehicles.values()].filter(
        (v) => v.lat !== 0 && v.lon !== 0 && v.routeCode !== '',
      )
      updateVehicles(withPosition)
    }

    const wsUrl =
      window.location.port === '5173'
        ? `ws://localhost:3001/ws/vehicles?ids=${encodeURIComponent(allIds.join(','))}`
        : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/vehicles?ids=${encodeURIComponent(allIds.join(','))}`
    const ws = new WebSocket(wsUrl)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as {
          type?: string
          id?: string
          lat?: number
          lon?: number
        }
        if (
          data.type !== 'location' ||
          !data.id ||
          data.lat == null ||
          data.lon == null
        )
          return
        const current = baseVehicles.get(String(data.id))
        if (!current) return
        baseVehicles.set(String(data.id), {
          ...current,
          lat: data.lat,
          lon: data.lon,
        })
        syncSnapshot()
      } catch {
        // ignore malformed frames
      }
    }

    ws.onerror = () => {
      if (!cancelled) updateVehicles([...baseVehicles.values()])
    }

    return () => {
      cancelled = true
      ws.close()
      updateVehicles([])
    }
  }, [arrivalLookup, raw, selectedStop, updateVehicles])
}
