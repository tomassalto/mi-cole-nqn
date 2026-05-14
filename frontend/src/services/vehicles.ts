import { apiFetch } from './api'

export interface RouteVehicle {
  id: string
  lat: number
  lon: number
  bearing: number
  name: string | null
}

export async function getRouteVehicles(serviceId: number): Promise<RouteVehicle[]> {
  return apiFetch<RouteVehicle[]>(`/routes/${encodeURIComponent(serviceId)}/vehicles`)
}
