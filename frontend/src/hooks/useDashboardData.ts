import { useState, useEffect, useCallback, useRef } from 'react'
import { calculateConnections } from '@/services/connections'
import { calculateShortcutTrips } from '@/services/shortcuts'
import type { Connection, SavedConnection, SavedShortcut, ShortcutTrip } from '@/types/api'

export interface ConnectionWithResults {
  conn: SavedConnection
  results: Connection[]
  loading: boolean
}

export interface ShortcutWithTrips {
  shortcut: SavedShortcut
  trips: ShortcutTrip[]
  loading: boolean
}

export interface DashboardData {
  connections: ConnectionWithResults[]
  shortcuts: ShortcutWithTrips[]
  loading: boolean
  refreshing: boolean
}

export function useDashboardData(
  savedConnections: SavedConnection[],
  savedShortcuts: SavedShortcut[],
) {
  const [data, setData] = useState<DashboardData>({
    connections: [],
    shortcuts: [],
    loading: true,
    refreshing: false,
  })
  const mountedRef = useRef(true)

  const load = useCallback(async (isRefresh = false) => {
    const hasConnections = savedConnections.length > 0
    const hasShortcuts = savedShortcuts.length > 0

    if (!hasConnections && !hasShortcuts) {
      setData({ connections: [], shortcuts: [], loading: false, refreshing: false })
      return
    }

    if (isRefresh) {
      setData(prev => ({ ...prev, refreshing: true }))
    } else {
      setData(prev => ({ ...prev, loading: true }))
    }

    // 1. Calculate connections in parallel
    let connectionResults: ConnectionWithResults[] = []
    if (hasConnections) {
      connectionResults = await Promise.all(
        savedConnections.map(async conn => {
          try {
            const res = await calculateConnections(
              conn.origin_stop_id,
              conn.transfer_stop_a_id ?? conn.origin_stop_id,
              conn.board_stop_id ?? conn.dest_stop_id,
              conn.dest_stop_id,
              conn.line_a_service_id,
              conn.line_b_service_id,
            )
            return { conn, results: res, loading: false } satisfies ConnectionWithResults
          } catch {
            return { conn, results: [], loading: false } satisfies ConnectionWithResults
          }
        }),
      )
    }

    // 2. Calculate shortcut trips (paired departure → arrival times)
    let shortcutData: ShortcutWithTrips[] = []
    if (hasShortcuts) {
      shortcutData = await Promise.all(
        savedShortcuts.map(async shortcut => {
          try {
            const trips = await calculateShortcutTrips(
              shortcut.origin_stop_id,
              shortcut.dest_stop_id,
              shortcut.line_service_id,
              shortcut.line_route_code ?? undefined,
            )
            return { shortcut, trips, loading: false } satisfies ShortcutWithTrips
          } catch {
            return { shortcut, trips: [], loading: false } satisfies ShortcutWithTrips
          }
        }),
      )
    }

    if (mountedRef.current) {
      setData({
        connections: connectionResults,
        shortcuts: shortcutData,
        loading: false,
        refreshing: false,
      })
    }
  }, [savedConnections, savedShortcuts])

  // Initial load only — no auto-refresh
  useEffect(() => {
    mountedRef.current = true
    load()
    return () => { mountedRef.current = false }
  }, [load])

  const refresh = useCallback(() => load(true), [load])

  return { ...data, refresh }
}
