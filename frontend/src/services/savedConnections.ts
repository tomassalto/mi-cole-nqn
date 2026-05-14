import type { SavedConnection } from '@/types/api'

export async function getSavedConnections(): Promise<SavedConnection[]> {
  const res = await fetch('/api/saved-connections')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function saveConnection(
  name: string,
  originStopId: number,
  originStopName: string,
  transferStopAId: number | null,
  transferStopAName: string | null,
  boardStopId: number | null,
  boardStopName: string | null,
  destStopId: number,
  destStopName: string,
  lineAServiceId: number,
  lineARouteCode: string,
  lineBServiceId: number,
  lineBRouteCode: string
): Promise<{ ok: boolean; id?: string }> {
  const res = await fetch('/api/saved-connections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      originStopId,
      originStopName,
      transferStopAId,
      transferStopAName,
      boardStopId,
      boardStopName,
      destStopId,
      destStopName,
      lineAServiceId,
      lineARouteCode,
      lineBServiceId,
      lineBRouteCode,
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteSavedConnection(id: string): Promise<void> {
  const res = await fetch(`/api/saved-connections/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export async function toggleConnectionNotifications(id: string, enabled: boolean): Promise<void> {
  const res = await fetch(`/api/saved-connections/${encodeURIComponent(id)}/notifications`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
