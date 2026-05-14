import { Router } from 'express'
import { db } from '../db'

const router = Router()

router.get('/', async (_req, res) => {
  const result = await db.execute('SELECT * FROM favorites ORDER BY type, created_at DESC')
  res.json(result.rows)
})

router.post('/stop/:stopId', async (req, res) => {
  const stopId = req.params.stopId
  const { name, lat, lon } = req.body as { name?: string; lat?: number; lon?: number }
  if (!name || lat == null || lon == null) {
    return res.status(400).json({ error: 'name, lat, lon son requeridos' })
  }
  await db.execute({
    sql: `INSERT OR REPLACE INTO favorites (id, type, name, lat, lon, created_at)
          VALUES (?, 'stop', ?, ?, ?, datetime('now'))`,
    args: [stopId, name, lat, lon],
  })
  res.json({ ok: true })
})

router.delete('/stop/:stopId', async (req, res) => {
  await db.execute({
    sql: "DELETE FROM favorites WHERE id = ? AND type = 'stop'",
    args: [req.params.stopId],
  })
  res.json({ ok: true })
})

router.post('/line', async (req, res) => {
  const { serviceId, routeCode, routeName } = req.body as {
    serviceId?: string; routeCode?: string; routeName?: string
  }
  if (!serviceId || !routeCode) {
    return res.status(400).json({ error: 'serviceId y routeCode son requeridos' })
  }
  const id = `line_${serviceId}`
  await db.execute({
    sql: `INSERT OR REPLACE INTO favorites (id, type, name, service_id, route_code, route_name, created_at)
          VALUES (?, 'line', ?, ?, ?, ?, datetime('now'))`,
    args: [id, routeName || routeCode, serviceId, routeCode, routeName ?? null],
  })
  res.json({ ok: true })
})

router.delete('/line/:serviceId', async (req, res) => {
  const id = `line_${req.params.serviceId}`
  await db.execute({
    sql: "DELETE FROM favorites WHERE id = ? AND type = 'line'",
    args: [id],
  })
  res.json({ ok: true })
})

export default router
