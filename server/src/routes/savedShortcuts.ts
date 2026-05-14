import { Router } from 'express'
import { randomUUID } from 'crypto'
import { db } from '../db'

const router = Router()

router.get('/', async (_req, res) => {
  const result = await db.execute('SELECT * FROM saved_shortcuts ORDER BY created_at DESC')
  res.json(result.rows)
})

router.post('/', async (req, res) => {
  const {
    name,
    lineServiceId,
    lineRouteCode,
    originStopId,
    originStopName,
    destStopId,
    destStopName,
  } = req.body as Record<string, unknown>

  if (!name || lineServiceId == null || originStopId == null || destStopId == null) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  const id = randomUUID()
  await db.execute({
    sql: `INSERT INTO saved_shortcuts (
            id, name, line_service_id, line_route_code,
            origin_stop_id, origin_stop_name,
            dest_stop_id, dest_stop_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    args: [
      id, name as string,
      lineServiceId as number, (lineRouteCode as string) || null,
      originStopId as number, (originStopName as string) || null,
      destStopId as number, (destStopName as string) || null,
    ],
  })

  res.json({ ok: true, id })
})

router.delete('/:id', async (req, res) => {
  await db.execute({ sql: 'DELETE FROM saved_shortcuts WHERE id = ?', args: [req.params.id] })
  res.json({ ok: true })
})

export default router
