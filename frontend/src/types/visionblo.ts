// ── Tipos de la API Visionblo (upstream) ─────────────────────────────────

export interface VisionbloArrival {
  service_id: number
  trip_id: number | null
  vehicle_id: number | null
  predicted: number | null   // timestamp ms
  scheduled: number           // timestamp ms
}

export interface VisionbloService {
  code: string
  name: string
  color: string
}

export interface VisionbloVehicle {
  id: number
  name: string | null
  lat: number
  lon: number
  bearing: number
}

export interface VisionbloStop {
  id: number
  nombre: string
  lat: number
  lon: number
  descripcion: string
  lugar: string
  code?: string
}

export interface VisionbloTripStop {
  stopId: number
  timestamp: number
}

export interface VisionbloTrip {
  stops: VisionbloTripStop[]
}

export interface VisionbloServiceResponse {
  service: {
    code: string
    name: string
    color: string
    path: string | null
    stops: number[]
    headings: number[]
  }
  vehicles: VisionbloVehicle[]
}

export interface VisionbloArrivalsResponse {
  arrivals: VisionbloArrival[]
  references: {
    services: Record<string, VisionbloService>
    vehicles: Record<string, VisionbloVehicle>
  }
}
