import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../db'

const router = Router()

router.get('/', async (_req, res) => {
  const result = await db.execute('SELECT * FROM saved_connections ORDER BY created_at DESC')
  res.json(result.rows)
})

router.post('/', async (req, res) => {
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
            notifications, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
    args: [
      id, name as string,
      originStopId as number, (originStopName as string) || null,
      (transferStopAId as number) ?? null, (transferStopAName as string) || null,
      (boardStopId as number) ?? null, (boardStopName as string) || null,
      destStopId as number, (destStopName as string) || null,
      lineAServiceId as number, (lineARouteCode as string) || null,
      lineBServiceId as number, (lineBRouteCode as string) || null,
    ],
  })

  res.json({ ok: true, id })
})

router.delete('/:id', async (req, res) => {
  await db.execute({ sql: 'DELETE FROM saved_connections WHERE id = ?', args: [req.params.id] })
  res.json({ ok: true })
})

router.put('/:id/notifications', async (req, res) => {
  const { enabled } = req.body as { enabled?: boolean }
  await db.execute({
    sql: 'UPDATE saved_connections SET notifications = ? WHERE id = ?',
    args: [enabled ? 1 : 0, req.params.id],
  })
  res.json({ ok: true })
})

export default router
