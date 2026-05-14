import { apiFetch } from './api'

export interface TripStopTime {
  stopId: number
  timestamp: number
}

export async function getTrip(tripId: string): Promise<{ stops: TripStopTime[] }> {
  return apiFetch<{ stops: TripStopTime[] }>(`/trip/${encodeURIComponent(tripId)}`)
}
