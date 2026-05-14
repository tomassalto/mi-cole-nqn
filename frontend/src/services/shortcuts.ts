import { getArrivals, getAvailableLines, normalizeArrivals, type StopLine } from './arrivals'
import { getTrip } from './trip'

export interface ShortcutTrip {
  departureTime: string
  departureMins: number
  arrivalTime: string
  arrivalMins: number
  predicted: boolean
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export async function calculateShortcutTrips(
  originStopId: number,
  destStopId: number,
  lineServiceId: number,
  lineRouteCode?: string
): Promise<ShortcutTrip[]> {
  const [originRaw, destRaw] = await Promise.all([
    getArrivals(originStopId),
    getArrivals(destStopId),
  ])
  const allOriginArrivals = normalizeArrivals(originRaw)
  const allDestArrivals = normalizeArrivals(destRaw)
  const matchesLine = (a: { serviceId: string; routeCode: string }) => {
    const serviceMatch = a.serviceId === String(lineServiceId)
    const routeMatch = lineRouteCode ? a.routeCode === lineRouteCode : false
    return serviceMatch || routeMatch
  }
  const originArrivals = allOriginArrivals.filter(matchesLine)
  const destArrivals = allDestArrivals.filter(matchesLine)
  const originCandidates = originArrivals.length ? originArrivals : allOriginArrivals
  const destCandidates = destArrivals.length ? destArrivals : allDestArrivals
  if (!originCandidates.length && !destCandidates.length) return []

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

  const results: ShortcutTrip[] = []
  const arrivals = [...originCandidates, ...destCandidates]
  const seenTrips = new Set<string>()

  for (const arrival of arrivals) {
    if (!arrival.tripId || seenTrips.has(arrival.tripId)) continue
    seenTrips.add(arrival.tripId)
    const trip = loadTrip(arrival.tripId)
    if (!trip) continue

    const tripStops = (await trip).stops
    const originTs = getTimestamp(tripStops, originStopId)
    const destTs = getTimestamp(tripStops, destStopId)
    if (originTs == null || destTs == null) continue

    const departureTs = Math.min(originTs, destTs)
    const arrivalTs = Math.max(originTs, destTs)

    results.push({
      departureTime: formatTime(departureTs),
      departureMins: Math.round((departureTs - Date.now()) / 60000),
      arrivalTime: formatTime(arrivalTs),
      arrivalMins: Math.round((arrivalTs - Date.now()) / 60000),
      predicted: originArrivals.find(a => a.tripId === arrival.tripId)?.predicted
        ?? destArrivals.find(a => a.tripId === arrival.tripId)?.predicted
        ?? false,
    })
  }

  if (results.length > 0) {
    return results
      .sort((a, b) => a.departureMins - b.departureMins)
      .slice(0, 5)
  }

  const originTimeline = originCandidates
    .map(a => ({ arrival: a, ts: a.predictedTs ?? a.scheduledTs }))
    .sort((a, b) => a.ts - b.ts)
  const destTimeline = destCandidates
    .map(a => ({ arrival: a, ts: a.predictedTs ?? a.scheduledTs }))
    .sort((a, b) => a.ts - b.ts)

  const fallback: ShortcutTrip[] = []
  const count = Math.min(originTimeline.length, destTimeline.length)
  for (let i = 0; i < count; i++) {
    const origin = originTimeline[i]
    const match = destTimeline[i]
    if (!origin || !match) continue
    if (match.ts < origin.ts) continue
    fallback.push({
      departureTime: formatTime(origin.ts),
      departureMins: Math.round((origin.ts - Date.now()) / 60000),
      arrivalTime: formatTime(match.ts),
      arrivalMins: Math.round((match.ts - Date.now()) / 60000),
      predicted: origin.arrival.predicted || match.arrival.predicted,
    })
    if (fallback.length >= 5) break
  }

  return fallback
}

export async function getShortcutLineCandidates(originStopId: number, destStopId: number): Promise<StopLine[]> {
  const [originLines, destLines] = await Promise.all([
    getAvailableLines(originStopId),
    getAvailableLines(destStopId),
  ])

  const destIds = new Set(destLines.map(line => line.serviceId))
  return originLines.filter(line => destIds.has(line.serviceId))
}
