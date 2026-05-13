import type { RouteShape } from '@/types/api'
import { apiFetch } from './api'

export async function getRouteShape(serviceId: number): Promise<RouteShape> {
  return apiFetch<RouteShape>(`/routes/${encodeURIComponent(serviceId)}/shape`)
}