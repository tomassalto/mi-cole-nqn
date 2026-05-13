import { Router } from 'express'
import db from '../db'

const router = Router()

router.get('/', (_req, res) => {
  res.json(db.prepare('SELECT * FROM favorites ORDER BY type, created_at DESC').all())
})

router.post('/stop/:stopId', (req, res) => {
  const stopId = req.params.stopId
  const { name, lat, lon } = req.body
  if (!name || lat == null || lon == null) {
    return res.status(400).json({ error: 'name, lat, lon son requeridos' })
  }
  db.prepare(`
    INSERT OR REPLACE INTO favorites (id, type, name, lat, lon, created_at)
    VALUES (?, 'stop', ?, ?, ?, datetime('now'))
  `).run(stopId, name, lat, lon)
  res.json({ ok: true })
})

router.delete('/stop/:stopId', (req, res) => {
  db.prepare("DELETE FROM favorites WHERE id = ? AND type = 'stop'").run(req.params.stopId)
  res.json({ ok: true })
})

router.post('/line', (req, res) => {
  const { serviceId, routeCode, routeName } = req.body
  if (!serviceId || !routeCode) {
    return res.status(400).json({ error: 'serviceId y routeCode son requeridos' })
  }
  const id = `line_${serviceId}`
  db.prepare(`
    INSERT OR REPLACE INTO favorites (id, type, name, service_id, route_code, route_name, created_at)
    VALUES (?, 'line', ?, ?, ?, ?, datetime('now'))
  `).run(id, routeName || routeCode, serviceId, routeCode, routeName)
  res.json({ ok: true })
})

router.delete('/line/:serviceId', (req, res) => {
  const id = `line_${req.params.serviceId}`
  db.prepare("DELETE FROM favorites WHERE id = ? AND type = 'line'").run(id)
  res.json({ ok: true })
})

export default router
