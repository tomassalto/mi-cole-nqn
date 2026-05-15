import { getArrivals, normalizeArrivals } from './arrivals'
import { getTrip } from './trip'
import type { Connection } from '@/types/api'

export async function calculateConnections(
  originStopId: number,
  transferStopAId: number,
  boardStopId: number,
  destStopId: number,
  lineAServiceId: number,
  lineBServiceId: number
): Promise<Connection[]> {
  const [rawA, rawB] = await Promise.all([
    getArrivals(originStopId),
    getArrivals(boardStopId),
  ])

  const arrivalsA = normalizeArrivals(rawA).filter(a => a.serviceId === String(lineAServiceId))
  const arrivalsB = normalizeArrivals(rawB).filter(a => a.serviceId === String(lineBServiceId))

  if (!arrivalsA.length || !arrivalsB.length) return []

  const now = Date.now()
  const connections: Connection[] = []
  const tripCache = new Map<string, Promise<{ stops: Array<{ stopId: number; timestamp: number }> }>>()

  const loadTrip = (tripId: string | null) => {
    if (!tripId) return null
    const hit = tripCache.get(tripId)
    if (hit) return hit
    const pending = getTrip(tripId)
    tripCache.set(tripId, pending)
    return pending
  }

  const getTimestamp = (
    stops: Array<{ stopId: number; timestamp: number }>,
    stopId: number
  ): number | null => {
    const hit = stops.find(stop => stop.stopId === stopId)
    return hit ? hit.timestamp : null
  }

  for (const a of arrivalsA) {
    const tripA = loadTrip(a.tripId)
    if (!tripA) continue
    const tripAStops = (await tripA).stops
    const transferTs = getTimestamp(tripAStops, transferStopAId)
    if (transferTs == null) continue

    for (const b of arrivalsB) {
      const tripB = loadTrip(b.tripId)
      if (!tripB) continue
      const tripBStops = (await tripB).stops
      const boardTs = getTimestamp(tripBStops, boardStopId)
      const finalTs = getTimestamp(tripBStops, destStopId)
      if (boardTs == null || boardTs < transferTs) continue

      const waitMs = Math.max(0, boardTs - transferTs)
      const waitMins = Math.round(waitMs / 60000)
      const totalMins = finalTs != null
        ? Math.round((finalTs - now) / 60000)
        : Math.round((boardTs - now) / 60000)

      connections.push({
        lineATime: new Date(a.predictedTs ?? a.scheduledTs).toLocaleTimeString('es-AR', {
          timeZone: 'America/Argentina/Buenos_Aires',
          hour: '2-digit', minute: '2-digit', hour12: false,
        }),
        lineAMins: a.minutesUntil,
        lineAPredicted: a.predicted,
        transferTime: new Date(transferTs).toLocaleTimeString('es-AR', {
          timeZone: 'America/Argentina/Buenos_Aires',
          hour: '2-digit', minute: '2-digit', hour12: false,
        }),
        transferMins: Math.round((transferTs - now) / 60000),
        transferPredicted: a.predicted,
        lineBTime: new Date(boardTs).toLocaleTimeString('es-AR', {
          timeZone: 'America/Argentina/Buenos_Aires',
          hour: '2-digit', minute: '2-digit', hour12: false,
        }),
        lineBMins: Math.round((boardTs - now) / 60000),
        lineBPredicted: b.predicted,
        finalTime: finalTs != null
          ? new Date(finalTs).toLocaleTimeString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            hour: '2-digit', minute: '2-digit', hour12: false,
          })
          : '',
        finalMins: totalMins,
        waitMins,
        totalMins,
        immediate: waitMins <= 10,
      })
    }
  }

  return connections
    .filter(c => c.waitMins >= 2) // mínimo 2 min de espera para no perder la combinación
    .sort((a, b) => (a.waitMins - b.waitMins) || (a.totalMins - b.totalMins))
    .slice(0, 10)
}
