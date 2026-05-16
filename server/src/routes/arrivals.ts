import { Router } from 'express'
import NodeCache from 'node-cache'
import { post } from '../lib/visionblo'

const router = Router()
const cache = new NodeCache({ stdTTL: 15 })

router.post('/:stopId', async (req, res) => {
  const stopId = parseInt(req.params.stopId)
  if (isNaN(stopId)) return res.status(400).json({ error: 'stopId inválido' })

  const firstTime = req.body.first_time ?? Date.now()
  const cacheKey = `arrivals_${stopId}`
  const cached = cache.get(cacheKey)
  if (cached) return res.json(cached)

  try {
    const data = await post('arrivals', {
      stop_id: stopId,
      first_time: firstTime
    })
    cache.set(cacheKey, data)
    cache.set(cacheKey, data)
    res.json(data)
  } catch (err) {
    res.status(502).json({ error: (err as Error).message })
  }
})

export default router
