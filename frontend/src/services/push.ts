function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const array = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) array[i] = rawData.charCodeAt(i)
  return array
}

export async function getVapidPublicKey(): Promise<string> {
  const res = await fetch('/api/push/vapid-public-key')
  if (!res.ok) throw new Error('Push notifications not configured on server')
  const data = (await res.json()) as { publicKey: string }
  return data.publicKey
}

export async function subscribePush(shortcutId: string, minutesThreshold: number): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications not supported in this browser')
  }

  const publicKey = await getVapidPublicKey()
  const reg = await navigator.serviceWorker.ready

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    })
  }

  const json = sub.toJSON()
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shortcutId,
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      minutesThreshold,
    }),
  })
  if (!res.ok) throw new Error(`Subscribe failed: HTTP ${res.status}`)
}

export async function unsubscribePush(shortcutId: string): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()

  if (sub) {
    await fetch(`/api/push/subscribe/${encodeURIComponent(shortcutId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    })
  }
}

/** Read/write active push subscriptions from localStorage */
const LS_KEY = 'micole-push-shortcuts'

export function getActivePushShortcuts(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Record<string, number>
  } catch {
    return {}
  }
}

export function setActivePush(shortcutId: string, minutesThreshold: number) {
  const data = getActivePushShortcuts()
  data[shortcutId] = minutesThreshold
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

export function clearActivePush(shortcutId: string) {
  const data = getActivePushShortcuts()
  delete data[shortcutId]
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}
