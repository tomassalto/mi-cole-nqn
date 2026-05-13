// ── Tipos para el frontend ────────────────────────────────────────────────

export interface Stop {
  id: number
  name: string
  code?: string
  lat: number
  lon: number
}

export interface Arrival {
  serviceId: string
  routeCode: string
  routeName: string
  minutesUntil: number
  predictedTs: number | null
  scheduledTs: number
  predicted: boolean
  vehicleId: string | null
  vehicleName: string | null
  tripId: string | null
  status: ArrivalStatus
  statusLabel: string
}

export type ArrivalStatus = 'early' | 'late' | 'ontime' | 'scheduled'

export interface Favorite {
  id: string
  type: 'stop' | 'line'
  name: string
  lat?: number
  lon?: number
  service_id?: number
  route_code?: string
  route_name?: string
}

export interface Vehicle {
  id: string
  lat: number
  lon: number
  routeCode: string
  serviceId: string
  minutesUntil: number
  arriving: boolean
  time: string
}

export interface RouteShape {
  encoded: string | null
  color: string
  code: string
  name: string
  stops: number[]
}

export interface TripStop {
  stopId: number
  name: string
  time: string
  isCurrent: boolean
}

export interface Connection {
  lineATime: string
  lineAMins: number
  lineAPredicted: boolean
  lineBTime: string
  lineBMins: number
  lineBPredicted: boolean
  waitMins: number
  totalMins: number
  immediate: boolean
}

export interface SavedConnection {
  id: string
  name: string
  origin_stop_id: number
  origin_stop_name: string | null
  dest_stop_id: number
  dest_stop_name: string | null
  line_a_service_id: number
  line_a_route_code: string | null
  line_b_service_id: number
  line_b_route_code: string | null
  notifications: number
  created_at: string
}
