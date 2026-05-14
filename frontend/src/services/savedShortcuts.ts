import type { SavedShortcut } from '@/types/api'

export async function getSavedShortcuts(): Promise<SavedShortcut[]> {
  const res = await fetch('/api/saved-shortcuts')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
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
    headers: { 'Content-Type': 'application/json' },
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
  const res = await fetch(`/api/saved-shortcuts/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
