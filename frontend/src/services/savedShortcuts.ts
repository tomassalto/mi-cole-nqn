import type { SavedShortcut } from '@/types/api'
import { authHeaders } from './api'

export async function getSavedShortcuts(): Promise<SavedShortcut[]> {
  const res = await fetch('/api/saved-shortcuts', { headers: authHeaders() })
  if (!res.ok) {
    if (res.status === 401) return []
    throw new Error(`HTTP ${res.status}`)
  }
  return res.json()
}

export async function saveShortcut(
  name: string,
  lineServiceId: number,
  lineRouteCode: string,
  originStopId: number,
  originStopName: string,
  destStopId: number,
  destStopName: string
): Promise<{ ok: boolean; id?: string }> {
  const res = await fetch('/api/saved-shortcuts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      name,
      lineServiceId,
      lineRouteCode,
      originStopId,
      originStopName,
      destStopId,
      destStopName,
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteSavedShortcut(id: string): Promise<void> {
  const res = await fetch(`/api/saved-shortcuts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
