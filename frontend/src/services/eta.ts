import { apiFetch } from './api'

export async function getEta(fromStop: number, toStop: number, serviceId: number): Promise<{
  minutesToFrom: number
  minutesToDest: number | null
  routeCode: string
  predicted: boolean
  error?: string
}> {
  const params = new URLSearchParams({
    fromStop: String(fromStop),
    toStop: String(toStop),
    serviceId: String(serviceId),
  })
  return apiFetch(`/eta?${params}`)
}
