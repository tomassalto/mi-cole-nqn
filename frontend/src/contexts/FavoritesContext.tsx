import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode
} from 'react'
import type { Favorite, Stop } from '@/types/api'
import { getFavorites, addFavorite, removeFavorite, addLineFavorite, removeLineFavorite } from '@/services/favorites'
import { useAuth } from './AuthContext'

interface FavoritesContextValue {
  stops: Favorite[]
  lines: Favorite[]
  loading: boolean
  isStopFavorited: (id: number) => boolean
  isLineFavorited: (serviceId: number) => boolean
  addStop: (stop: Stop) => Promise<void>
  removeStop: (id: number) => Promise<void>
  addLine: (serviceId: number, routeCode: string, routeName: string) => Promise<void>
  removeLine: (serviceId: number) => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, requireAuth } = useAuth()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) {
      setFavorites([])
      setLoading(false)
      return
    }
    try {
      const data = await getFavorites()
      setFavorites(data)
    } catch {
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  const addStop = useCallback(async (stop: Stop) => {
    if (!requireAuth(() => addStop(stop))) return
    await addFavorite(stop.id, stop.name, stop.lat, stop.lon)
    await load()
  }, [load, requireAuth])

  const removeStop = useCallback(async (id: number) => {
    if (!requireAuth(() => removeStop(id))) return
    await removeFavorite(id)
    await load()
  }, [load, requireAuth])

  const addLine = useCallback(async (serviceId: number, routeCode: string, routeName: string) => {
    if (!requireAuth(() => addLine(serviceId, routeCode, routeName))) return
    await addLineFavorite(serviceId, routeCode, routeName)
    await load()
  }, [load, requireAuth])

  const removeLine = useCallback(async (serviceId: number) => {
    if (!requireAuth(() => removeLine(serviceId))) return
    await removeLineFavorite(serviceId)
    await load()
  }, [load, requireAuth])

  const stops = favorites.filter(f => f.type === 'stop')
  const lines = favorites.filter(f => f.type === 'line')

  return (
    <FavoritesContext.Provider value={{
      stops,
      lines,
      loading,
      isStopFavorited: (id: number) => stops.some(f => Number(f.id?.split('_').pop()) === id),
      isLineFavorited: (serviceId: number) => lines.some(f => Number(f.service_id) === serviceId),
      addStop,
      removeStop,
      addLine,
      removeLine,
    }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider')
  return ctx
}
