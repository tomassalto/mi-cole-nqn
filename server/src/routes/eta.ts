import { Router } from 'express'
import NodeCache from 'node-cache'
import { post } from '../lib/visionblo'

const router = Router()
const cache = new NodeCache({ stdTTL: 60 })
const tripCache = new NodeCache({ stdTTL: 60 })

async function getTripStops(tripId: number): Promise<Array<{ stopId: number; timestamp: number }>> {
  const hit = tripCache.get<Array<{ stopId: number; timestamp: number }>>(String(tripId))
  if (hit) return hit

  const data = await post<{
    stops?: Array<{ stop_id: number; timestamp: number }>
  }>('trip', { trip_id: tripId })

  const stops = (data.stops ?? []).map(stop => ({
    stopId: stop.stop_id,
    timestamp: stop.timestamp,
  }))

  tripCache.set(String(tripId), stops)
  return stops
}

function getStopTimestamp(
  stops: Array<{ stopId: number; timestamp: number }>,
  stopId: number
): number | null {
  const hit = stops.find(stop => stop.stopId === stopId)
  return hit ? hit.timestamp : null
}

router.get('/', async (req, res) => {
  const fromStop = parseInt(req.query.fromStop as string, 10)
  const toStop = parseInt(req.query.toStop as string, 10)
  const serviceId = parseInt(req.query.serviceId as string, 10)

  if (Number.isNaN(fromStop) || Number.isNaN(toStop) || Number.isNaN(serviceId)) {
    return res.status(400).json({ error: 'fromStop, toStop y serviceId son requeridos' })
  }

  const cacheKey = `${fromStop}_${toStop}_${serviceId}`
  const cached = cache.get<{
    minutesToFrom: number
    minutesToDest: number | null
    routeCode: string
    predicted: boolean
  }>(cacheKey)
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
        predicted: false,
      })
    }

    const now = Date.now()
    const anchorTs = arrival.predicted ?? arrival.scheduled
    let minutesToFrom = Math.max(0, Math.round((anchorTs - now) / 60000))
    let minutesToDest: number | null = null

    if (arrival.trip_id != null) {
      const tripStops = await getTripStops(arrival.trip_id)
      const fromTs = getStopTimestamp(tripStops, fromStop)
      const toTs = getStopTimestamp(tripStops, toStop)

      if (fromTs != null) {
        minutesToFrom = Math.max(0, Math.round((fromTs - now) / 60000))
      }

      if (fromTs != null && toTs != null && toTs >= fromTs) {
        minutesToDest = Math.max(0, Math.round((toTs - fromTs) / 60000))
      }
    }

    const result = {
      minutesToFrom,
      minutesToDest,
      routeCode: String(serviceId),
      predicted: arrival.predicted != null,
    }

    cache.set(cacheKey, result)
    res.json(result)
  } catch (err) {
    res.status(502).json({ error: (err as Error).message })
  }
})

export default router
