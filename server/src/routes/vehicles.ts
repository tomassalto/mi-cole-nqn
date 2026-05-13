import { Router } from 'express'
import NodeCache from 'node-cache'
import { post } from '../lib/visionblo'

const router = Router()
const cache = new NodeCache({ stdTTL: 60 })

router.get('/:tripId', async (req, res) => {
  const tripId = parseInt(req.params.tripId)
  if (isNaN(tripId)) return res.status(400).json({ error: 'tripId inválido' })

  const cached = cache.get(tripId)
  if (cached) return res.json(cached)

  try {
    const data = await post<{
      stops?: Array<{ stop_id: number; timestamp: number }>
    }>('trip', { trip_id: tripId })

    const stops = (data.stops ?? []).map(s => ({
      stopId: s.stop_id,
      timestamp: s.timestamp
    }))

    cache.set(tripId, { stops })
    res.json({ stops })
  } catch (err) {
    res.status(502).json({ error: (err as Error).message })
  }
})

export default router
