import { Router } from 'express'
import { randomUUID } from 'crypto'
import db from '../db'

const router = Router()

router.get('/', (_req, res) => {
  res.json(db.prepare('SELECT * FROM saved_shortcuts ORDER BY created_at DESC').all())
})

router.post('/', (req, res) => {
  const {
    name,
    lineServiceId,
    lineRouteCode,
    originStopId,
    originStopName,
    destStopId,
    destStopName,
  } = req.body

  if (!name || lineServiceId == null || originStopId == null || destStopId == null) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  const id = randomUUID()
  db.prepare(`
    INSERT INTO saved_shortcuts (
      id,
      name,
      line_service_id,
      line_route_code,
      origin_stop_id,
      origin_stop_name,
      dest_stop_id,
      dest_stop_name,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    id,
    name,
    lineServiceId,
    lineRouteCode || null,
    originStopId,
    originStopName || null,
    destStopId,
    destStopName || null
  )

  res.json({ ok: true, id })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM saved_shortcuts WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
