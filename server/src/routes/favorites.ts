import { Router } from 'express'
import { db } from '../db'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM favorites WHERE user_id = ? ORDER BY type, created_at DESC',
    args: [req.userId!],
  })
  res.json(result.rows)
})

router.post('/stop/:stopId', requireAuth, async (req, res) => {
  const stopId = req.params.stopId
  const { name, lat, lon } = req.body as { name?: string; lat?: number; lon?: number }
  if (!name || lat == null || lon == null) {
    return res.status(400).json({ error: 'name, lat, lon son requeridos' })
  }
  const id = `${req.userId}_${stopId}`
  await db.execute({
    sql: `INSERT OR REPLACE INTO favorites (id, type, name, lat, lon, user_id, created_at)
          VALUES (?, 'stop', ?, ?, ?, ?, datetime('now'))`,
    args: [id, name, lat, lon, req.userId!],
  })
  res.json({ ok: true })
})

router.delete('/stop/:stopId', requireAuth, async (req, res) => {
  const id = `${req.userId}_${req.params.stopId}`
  await db.execute({
    sql: "DELETE FROM favorites WHERE id = ? AND type = 'stop' AND user_id = ?",
    args: [id, req.userId!],
  })
  res.json({ ok: true })
})

router.post('/line', requireAuth, async (req, res) => {
  const { serviceId, routeCode, routeName } = req.body as {
    serviceId?: string; routeCode?: string; routeName?: string
  }
  if (!serviceId || !routeCode) {
    return res.status(400).json({ error: 'serviceId y routeCode son requeridos' })
  }
  const id = `${req.userId}_line_${serviceId}`
  await db.execute({
    sql: `INSERT OR REPLACE INTO favorites (id, type, name, service_id, route_code, route_name, user_id, created_at)
          VALUES (?, 'line', ?, ?, ?, ?, ?, datetime('now'))`,
    args: [id, routeName || routeCode, serviceId, routeCode, routeName ?? null, req.userId!],
  })
  res.json({ ok: true })
})

router.delete('/line/:serviceId', requireAuth, async (req, res) => {
  const id = `${req.userId}_line_${req.params.serviceId}`
  await db.execute({
    sql: "DELETE FROM favorites WHERE id = ? AND type = 'line' AND user_id = ?",
    args: [id, req.userId!],
  })
  res.json({ ok: true })
})

export default router
