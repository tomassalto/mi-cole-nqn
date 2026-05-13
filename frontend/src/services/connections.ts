import { getArrivals, normalizeArrivals } from './arrivals'
import type { Connection } from '@/types/api'

export async function calculateConnections(
  originStopId: number,
  destStopId: number,
  lineAServiceId: number,
  lineBServiceId: number
): Promise<Connection[]> {
  const [rawA, rawB] = await Promise.all([
    getArrivals(originStopId),
    getArrivals(destStopId),
  ])

  const arrivalsA = normalizeArrivals(rawA).filter(a => a.serviceId === String(lineAServiceId))
  const arrivalsB = normalizeArrivals(rawB).filter(a => a.serviceId === String(lineBServiceId))

  if (!arrivalsA.length || !arrivalsB.length) return []

  const now = Date.now()
  const connections: Connection[] = []

  for (const a of arrivalsA) {
    for (const b of arrivalsB) {
      const tsA = a.predictedTs ?? a.scheduledTs
      const tsB = b.predictedTs ?? b.scheduledTs
      const waitMs = Math.max(0, tsB - tsA)
      const waitMins = Math.round(waitMs / 60000)
      const totalMins = Math.round((tsB - now) / 60000)

      connections.push({
        lineATime: new Date(tsA).toLocaleTimeString('es-AR', {
          timeZone: 'America/Argentina/Buenos_Aires',
          hour: '2-digit', minute: '2-digit', hour12: false,
        }),
        lineAMins: a.minutesUntil,
        lineAPredicted: a.predicted,
        lineBTime: new Date(tsB).toLocaleTimeString('es-AR', {
          timeZone: 'America/Argentina/Buenos_Aires',
          hour: '2-digit', minute: '2-digit', hour12: false,
        }),
        lineBMins: b.minutesUntil,
        lineBPredicted: b.predicted,
        waitMins,
        totalMins,
        immediate: waitMins <= 10,
      })
    }
  }

  return connections
    .sort((a, b) => a.totalMins - b.totalMins)
    .slice(0, 10)
}