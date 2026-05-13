import { Router } from 'express'
import NodeCache from 'node-cache'
import { post } from '../lib/visionblo'

const router = Router()
const cache = new NodeCache({ stdTTL: 60 })

router.get('/', async (req, res) => {
  const fromStop = parseInt(req.query.fromStop as string)
  const toStop = parseInt(req.query.toStop as string)
  const serviceId = parseInt(req.query.serviceId as string)

  if (isNaN(fromStop) || isNaN(toStop) || isNaN(serviceId)) {
    return res.status(400).json({ error: 'fromStop, toStop y serviceId son requeridos' })
  }

  const cacheKey = `${fromStop}_${toStop}_${serviceId}`
  const cached = cache.get(cacheKey)
  if (cached) return res.json(cached)

  try {
    const arrivalsData = await post<{
      arrivals: Array<{
        service_id: number
        predicted: number | null
        scheduled: number
        trip_id: number | null
      }>
    }>('arrivals', { stop_id: fromStop, first_time: Date.now() })

    const arrival = arrivalsData.arrivals.find(a => a.service_id === serviceId)

    if (!arrival) {
      return res.json({
        error: 'No hay información de llegada para esa línea',
        minutesToFrom: null,
        minutesToDest: null,
        routeCode: String(serviceId),
        predicted: false
      })
    }

    const now = Date.now()
    const minutesToFrom = Math.max(0, Math.round((arrival.predicted ?? arrival.scheduled - now) / 60000))

    const shapeData = await post<{
      service?: { path?: string; stops?: number[] }
    }>('service', { service_id: serviceId, encode_polyline: false, vehicles: false })

    const stops = shapeData.service?.stops ?? []
    const fromIdx = stops.indexOf(fromStop)
    const toIdx = stops.indexOf(toStop)

    let minutesToDest: number | null = null
    if (fromIdx >= 0 && toIdx > fromIdx) {
      minutesToDest = minutesToFrom + (toIdx - fromIdx) * 2
    }

    const result = {
      minutesToFrom,
      minutesToDest,
      routeCode: String(serviceId),
      predicted: arrival.predicted != null
    }

    cache.set(cacheKey, result)
    res.json(result)
  } catch (err) {
    res.status(502).json({ error: (err as Error).message })
  }
})

export default router
