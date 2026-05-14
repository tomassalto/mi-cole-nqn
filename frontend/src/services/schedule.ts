import type { TripStop } from '@/types/api'
import { apiFetch } from './api'

export async function getSchedule(tripId: string): Promise<{ stops: TripStop[] }> {
  const data = await apiFetch<{ stops: Array<{ stopId: number; timestamp: number }> }>(`/trip/${encodeURIComponent(tripId)}`)
  return {
    stops: data.stops.map(s => ({
      stopId: s.stopId,
      name: `Parada ${s.stopId}`,
      time: new Date(s.timestamp).toLocaleTimeString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      isCurrent: false,
    })),
  }
}
