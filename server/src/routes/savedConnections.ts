import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../db'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM saved_connections WHERE user_id = ? ORDER BY created_at DESC',
    args: [req.userId!],
  })
  res.json(result.rows)
})

router.post('/', requireAuth, async (req, res) => {
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
  } = req.body as Record<string, unknown>

  if (!name || originStopId == null || destStopId == null || lineAServiceId == null || lineBServiceId == null) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  const id = randomUUID()
  await db.execute({
    sql: `INSERT INTO saved_connections (
            id, name,
            origin_stop_id, origin_stop_name,
            transfer_stop_a_id, transfer_stop_a_name,
            board_stop_id, board_stop_name,
            dest_stop_id, dest_stop_name,
            line_a_service_id, line_a_route_code,
            line_b_service_id, line_b_route_code,
            notifications, user_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, datetime('now'))`,
    args: [
      id, name as string,
      originStopId as number, (originStopName as string) || null,
      (transferStopAId as number) ?? null, (transferStopAName as string) || null,
      (boardStopId as number) ?? null, (boardStopName as string) || null,
      destStopId as number, (destStopName as string) || null,
      lineAServiceId as number, (lineARouteCode as string) || null,
      lineBServiceId as number, (lineBRouteCode as string) || null,
      req.userId!,
    ],
  })

  res.json({ ok: true, id })
})

router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params
  await db.execute({
    sql: 'DELETE FROM saved_connections WHERE id = ? AND user_id = ?',
    args: [id as string, req.userId!],
  })
  res.json({ ok: true })
})

router.put('/:id/notifications', requireAuth, async (req, res) => {
  const { id } = req.params
  const { enabled } = req.body as { enabled?: boolean }
  await db.execute({
    sql: 'UPDATE saved_connections SET notifications = ? WHERE id = ? AND user_id = ?',
    args: [enabled ? 1 : 0, id as string, req.userId!],
  })
  res.json({ ok: true })
})

export default router
