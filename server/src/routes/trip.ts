import { Router } from 'express'
import NodeCache from 'node-cache'
import { post } from '../lib/visionblo'

const router = Router()
const cache = new NodeCache({ stdTTL: 60 })

router.get('/:tripId', async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10)
  if (Number.isNaN(tripId)) {
    return res.status(400).json({ error: 'tripId inválido' })
  }

  const cached = cache.get<{ stops: Array<{ stopId: number; timestamp: number }> }>(String(tripId))
  if (cached) return res.json(cached)

  try {
    const data = await post<{
      stops?: Array<{ stop_id: number; timestamp: number }>
    }>('trip', { trip_id: tripId })

    const result = {
      stops: (data.stops ?? []).map(stop => ({
        stopId: stop.stop_id,
        timestamp: stop.timestamp,
      })),
    }

    cache.set(String(tripId), result)
    res.json(result)
  } catch (err) {
    res.status(502).json({ error: (err as Error).message })
  }
})

export default router
