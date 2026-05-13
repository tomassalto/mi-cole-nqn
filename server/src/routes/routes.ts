import { Router } from 'express'
import NodeCache from 'node-cache'
import { post } from '../lib/visionblo'

const router = Router()
const shapeCache = new NodeCache({ stdTTL: 3600 })
const vehicleCache = new NodeCache({ stdTTL: 10 })

router.get('/:serviceId/shape', async (req, res) => {
  const serviceId = parseInt(req.params.serviceId)
  if (isNaN(serviceId)) return res.status(400).json({ error: 'serviceId debe ser numérico' })

  const hit = shapeCache.get(serviceId)
  if (hit) return res.json(hit)

  try {
    const data = await post<{
      service?: {
        path?: string
        color?: string
        code?: string
        name?: string
        stops?: number[]
      }
    }>('service', {
      service_id: serviceId,
      encode_polyline: true,
      vehicles: false
    })

    const svc = data.service ?? {}
    const result = {
      encoded: svc.path ?? null,
      color: svc.color ? `#${svc.color}` : '#1565C0',
      code: svc.code ?? String(serviceId),
      name: svc.name ?? '',
      stops: svc.stops ?? []
    }

    shapeCache.set(serviceId, result)
    res.json(result)
  } catch (err) {
    res.status(502).json({ error: (err as Error).message })
  }
})

router.get('/:serviceId/vehicles', async (req, res) => {
  const serviceId = parseInt(req.params.serviceId)
  if (isNaN(serviceId)) return res.status(400).json({ error: 'serviceId debe ser numérico' })

  const cacheKey = `v_${serviceId}`
  const hit = vehicleCache.get(cacheKey)
  if (hit) return res.json(hit)

  try {
    const data = await post<{ vehicles?: Array<{
      id?: number
      vehicle_id?: number
      lat?: number
      lon?: number
      bearing?: number
      heading?: number
      name?: string
    }> }>('service', {
      service_id: serviceId,
      encode_polyline: false,
      vehicles: true
    })

    const vehicles = (data.vehicles ?? [])
      .filter(v => v.lat != null && v.lon != null)
      .map(v => ({
        id: v.id ?? v.vehicle_id,
        lat: v.lat,
        lon: v.lon,
        bearing: v.bearing ?? v.heading ?? 0,
        name: v.name ?? null
      }))

    vehicleCache.set(cacheKey, vehicles)
    res.json(vehicles)
  } catch (err) {
    res.status(502).json({ error: (err as Error).message })
  }
})

export default router
