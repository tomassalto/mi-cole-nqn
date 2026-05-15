import { useState, useEffect, useCallback } from 'react'
import { getSchedule } from '@/services/schedule'
import type { TripStop, Stop } from '@/types/api'

export function useSchedule(tripId: string | null, currentStopId: number | null, stops: Stop[]) {
  const [scheduleStops, setScheduleStops] = useState<TripStop[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!tripId) return
    setLoading(true)
    try {
      const data = await getSchedule(tripId, stops)
      setScheduleStops(data.stops.map(s => ({
        ...s,
        isCurrent: s.stopId === currentStopId,
      })))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [tripId, currentStopId, stops])

  useEffect(() => { load() }, [load])

  return { stops: scheduleStops, loading, error }
}
