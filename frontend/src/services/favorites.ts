import type { Favorite } from '@/types/api'
import { apiFetch, authHeaders } from './api'

export async function getFavorites(): Promise<Favorite[]> {
  return apiFetch<Favorite[]>('/favorites')
}

export async function addFavorite(stopId: number, name: string, lat: number, lon: number): Promise<void> {
  await fetch(`/api/favorites/stop/${encodeURIComponent(stopId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, lat, lon }),
  })
}

export async function removeFavorite(stopId: number): Promise<void> {
  await fetch(`/api/favorites/stop/${encodeURIComponent(stopId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

export async function addLineFavorite(serviceId: number, routeCode: string, routeName: string): Promise<void> {
  await fetch('/api/favorites/line', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ serviceId, routeCode, routeName }),
  })
}

export async function removeLineFavorite(serviceId: number): Promise<void> {
  await fetch(`/api/favorites/line/${encodeURIComponent(serviceId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}
