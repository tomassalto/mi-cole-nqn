import { useState, useEffect, useCallback, useRef } from 'react'
import { getArrivals, normalizeArrivals } from '@/services/arrivals'
import type { Arrival } from '@/types/api'

export function useArrivals(stopId: number | null) {
  const [arrivals, setArrivals] = useState<Arrival[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    if (!stopId) return
    try {
      const data = await getArrivals(stopId)
      setArrivals(normalizeArrivals(data))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }, [stopId])

  useEffect(() => {
    if (!stopId) { setArrivals([]); setLoading(false); setError(null); return }
    setLoading(true)
    load().finally(() => setLoading(false))
    intervalRef.current = setInterval(load, 15_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [stopId, load])

  return { arrivals, loading, error, refetch: load }
}