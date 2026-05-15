import type { TripStop, Stop } from '@/types/api'
import { apiFetch } from './api'

export async function getSchedule(tripId: string, stops: Stop[]): Promise<{ stops: TripStop[] }> {
  const data = await apiFetch<{ stops: Array<{ stopId: number; timestamp: number | null }> }>(`/trip/${encodeURIComponent(tripId)}`)
  const stopMap = new Map(stops.map(s => [s.id, s.name]))
  return {
    stops: data.stops.map(s => ({
      stopId: s.stopId,
      name: stopMap.get(s.stopId) ?? `Parada ${s.stopId}`,
      time: s.timestamp
        ? new Date(s.timestamp).toLocaleTimeString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        : '—',
      isCurrent: false,
    })),
  }
}
