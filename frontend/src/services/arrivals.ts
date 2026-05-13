import type { VisionbloArrivalsResponse } from '@/types/visionblo'
import type { Arrival, ArrivalStatus } from '@/types/api'

export async function getArrivals(stopId: number): Promise<VisionbloArrivalsResponse> {
  const res = await fetch(`/api/arrivals/${encodeURIComponent(stopId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ first_time: Date.now() }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`)
  }
  return res.json()
}

function getArrivalStatus(
  predicted: number | undefined,
  scheduled: number
): { class: ArrivalStatus; label: string; diffMin: number } {
  if (!predicted || !scheduled) return { class: 'scheduled', label: 'Horario', diffMin: 0 }
  const diffMin = Math.round((predicted - scheduled) / 60000)
  if (diffMin <= -1) return { class: 'early', label: `${Math.abs(diffMin)} min antes`, diffMin }
  if (diffMin >= 1) return { class: 'late', label: `${diffMin} min después`, diffMin }
  return { class: 'ontime', label: 'A tiempo', diffMin: 0 }
}

export function normalizeArrivals(data: VisionbloArrivalsResponse): Arrival[] {
  const now = Date.now()
  const services = data.references?.services ?? {}

  return (data.arrivals ?? [])
    .map(a => {
      const time = a.predicted ?? a.scheduled
      const minutesUntil = Math.round((time - now) / 60000)
      const svc = services[String(a.service_id)] ?? {}
      const status = getArrivalStatus(a.predicted ?? undefined, a.scheduled)

      return {
        serviceId: String(a.service_id),
        routeCode: svc.code ?? String(a.service_id),
        routeName: svc.name ?? '',
        minutesUntil,
        predictedTs: a.predicted ?? null,
        scheduledTs: a.scheduled,
        predicted: a.predicted != null,
        vehicleId: a.vehicle_id != null ? String(a.vehicle_id) : null,
        vehicleName: null,
        tripId: a.trip_id != null ? String(a.trip_id) : null,
        status: status.class,
        statusLabel: status.label,
      } satisfies Arrival
    })
    .filter(a => a.minutesUntil <= 120)
    .sort((a, b) => a.minutesUntil - b.minutesUntil)
}