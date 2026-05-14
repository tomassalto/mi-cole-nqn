import webpush from 'web-push'
import db from '../db'
import { post } from './visionblo'

interface PushRow {
  id: number
  shortcut_id: string
  endpoint: string
  p256dh: string
  auth: string
  minutes_threshold: number
  last_notified_at: string | null
  line_service_id: number
  line_route_code: string | null
  origin_stop_id: number
  origin_stop_name: string | null
  dest_stop_name: string | null
}

interface VisionbloArrival {
  service_id: number
  predicted: number | null
  scheduled: number
}

interface VisionbloArrivalsResponse {
  arrivals: VisionbloArrival[]
  references: {
    services: Record<string, { code: string; name: string }>
  }
}

const MIN_NOTIFY_INTERVAL_MS = 10 * 60 * 1000 // 10 min between notifications for same shortcut

async function checkAndNotify() {
  // Check if VAPID is configured
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return

  const rows = db.prepare(`
    SELECT
      ps.id,
      ps.shortcut_id,
      ps.endpoint,
      ps.p256dh,
      ps.auth,
      ps.minutes_threshold,
      ps.last_notified_at,
      ss.line_service_id,
      ss.line_route_code,
      ss.origin_stop_id,
      ss.origin_stop_name,
      ss.dest_stop_name
    FROM push_subscriptions ps
    JOIN saved_shortcuts ss ON ss.id = ps.shortcut_id
  `).all() as PushRow[]

  if (rows.length === 0) return

  // Group by origin_stop_id to avoid duplicate arrivals calls
  const byStop = new Map<number, PushRow[]>()
  for (const row of rows) {
    const arr = byStop.get(row.origin_stop_id) ?? []
    arr.push(row)
    byStop.set(row.origin_stop_id, arr)
  }

  for (const [stopId, subscriptions] of byStop.entries()) {
    let arrivalsData: VisionbloArrivalsResponse | null = null
    try {
      arrivalsData = await post('arrivals', {
        stop_id: stopId,
        first_time: Date.now(),
      }) as VisionbloArrivalsResponse
    } catch {
      continue // skip if API is down
    }

    const now = Date.now()
    const arrivals = (arrivalsData?.arrivals ?? []).filter(a => {
      const time = a.predicted ?? a.scheduled
      const minsUntil = (time - now) / 60000
      return minsUntil >= 0 && minsUntil <= 60
    })

    for (const sub of subscriptions) {
      // Check cooldown
      if (sub.last_notified_at) {
        const lastNotifiedMs = new Date(sub.last_notified_at).getTime()
        if (now - lastNotifiedMs < MIN_NOTIFY_INTERVAL_MS) continue
      }

      // Find the soonest arrival for this service
      const matching = arrivals
        .filter(a => a.service_id === sub.line_service_id)
        .map(a => {
          const time = a.predicted ?? a.scheduled
          return Math.round((time - now) / 60000)
        })
        .filter(m => m >= 0)
        .sort((a, b) => a - b)

      if (matching.length === 0) continue
      const minsUntil = matching[0]
      if (minsUntil > sub.minutes_threshold) continue

      // Send push notification
      const payload = JSON.stringify({
        title: `Línea ${sub.line_route_code ?? sub.line_service_id} llega en ${minsUntil} min`,
        body: `${sub.origin_stop_name ?? `Parada ${stopId}`} → ${sub.dest_stop_name ?? 'Destino'}`,
        url: '/',
      })

      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        db.prepare(`
          UPDATE push_subscriptions SET last_notified_at = datetime('now') WHERE id = ?
        `).run(sub.id)
        console.log(`[notifier] Push sent to shortcut ${sub.shortcut_id}: ${minsUntil} min`)
      } catch (err: unknown) {
        const httpErr = err as { statusCode?: number }
        if (httpErr?.statusCode === 410 || httpErr?.statusCode === 404) {
          // Subscription expired — delete it
          db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(sub.id)
          console.log(`[notifier] Deleted expired subscription ${sub.id}`)
        } else {
          console.error('[notifier] Push error:', err)
        }
      }
    }
  }
}

const INTERVAL_MS = 5 * 60 * 1000 // 5 min

export function startNotifier() {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log('[notifier] VAPID keys not set — push notifications disabled')
    return
  }
  console.log('[notifier] Started (interval: 5 min)')
  setTimeout(() => {
    checkAndNotify().catch(console.error)
    setInterval(() => checkAndNotify().catch(console.error), INTERVAL_MS)
  }, 30_000) // first check 30s after startup to let everything warm up
}
