import type { Stop, RouteShape } from '@/types/api'
import { apiFetch } from './api'

export async function getStopsAll(): Promise<Stop[]> {
  return apiFetch<Stop[]>('/stops/all')
}

export async function getRouteShape(serviceId: number): Promise<RouteShape> {
  return apiFetch<RouteShape>(`/routes/${encodeURIComponent(serviceId)}/shape`)
}