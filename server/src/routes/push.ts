import { Router } from 'express'
import webpush from 'web-push'
import { db } from '../db'

const router = Router()

// VAPID keys must be set in environment variables.
// Generate once with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? ''
const VAPID_EMAIL = process.env.VAPID_EMAIL ?? 'mailto:admin@example.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

router.get('/vapid-public-key', (_req, res) => {
  if (!VAPID_PUBLIC_KEY) {
    return res.status(503).json({ error: 'Push notifications not configured' })
  }
  res.json({ publicKey: VAPID_PUBLIC_KEY })
})

router.post('/subscribe', async (req, res) => {
  const { shortcutId, endpoint, p256dh, auth, minutesThreshold } = req.body as {
    shortcutId: string
    endpoint: string
    p256dh: string
    auth: string
    minutesThreshold: number
  }

  if (!shortcutId || !endpoint || !p256dh || !auth) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Verify shortcut exists
  const result = await db.execute({ sql: 'SELECT id FROM saved_shortcuts WHERE id = ?', args: [shortcutId] })
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Shortcut not found' })
  }

  await db.execute({
    sql: `INSERT INTO push_subscriptions (shortcut_id, endpoint, p256dh, auth, minutes_threshold)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(shortcut_id, endpoint) DO UPDATE SET minutes_threshold = excluded.minutes_threshold`,
    args: [shortcutId, endpoint, p256dh, auth, minutesThreshold ?? 5],
  })

  res.json({ ok: true })
})

router.delete('/subscribe/:shortcutId', async (req, res) => {
  const { shortcutId } = req.params
  const { endpoint } = req.body as { endpoint?: string }

  if (endpoint) {
    await db.execute({
      sql: 'DELETE FROM push_subscriptions WHERE shortcut_id = ? AND endpoint = ?',
      args: [shortcutId, endpoint],
    })
  } else {
    await db.execute({
      sql: 'DELETE FROM push_subscriptions WHERE shortcut_id = ?',
      args: [shortcutId],
    })
  }

  res.json({ ok: true })
})

export { webpush, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY }
export default router
