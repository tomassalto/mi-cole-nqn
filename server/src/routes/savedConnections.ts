import { Router } from 'express'
import { randomUUID } from 'crypto'
import db from '../db'

const router = Router()

router.get('/', (_req, res) => {
  res.json(db.prepare('SELECT * FROM saved_connections ORDER BY created_at DESC').all())
})

router.post('/', (req, res) => {
  const {
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
  } = req.body

  if (!name || originStopId == null || destStopId == null || lineAServiceId == null || lineBServiceId == null) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  const id = randomUUID()
  db.prepare(`
    INSERT INTO saved_connections (
      id,
      name,
      origin_stop_id,
      origin_stop_name,
      transfer_stop_a_id,
      transfer_stop_a_name,
      board_stop_id,
      board_stop_name,
      dest_stop_id,
      dest_stop_name,
      line_a_service_id,
      line_a_route_code,
      line_b_service_id,
      line_b_route_code,
      notifications,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))
  `).run(
    id,
    name,
    originStopId,
    originStopName || null,
    transferStopAId ?? null,
    transferStopAName || null,
    boardStopId ?? null,
    boardStopName || null,
    destStopId,
    destStopName || null,
    lineAServiceId,
    lineARouteCode || null,
    lineBServiceId,
    lineBRouteCode || null,
  )

  res.json({ ok: true, id })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM saved_connections WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

router.put('/:id/notifications', (req, res) => {
  const { enabled } = req.body
  db.prepare('UPDATE saved_connections SET notifications = ? WHERE id = ?').run(enabled ? 1 : 0, req.params.id)
  res.json({ ok: true })
})

export default router
