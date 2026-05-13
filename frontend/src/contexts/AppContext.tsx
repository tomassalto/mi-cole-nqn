import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { SavedConnection } from '@/types/api'
import { getSavedConnections } from '@/services/savedConnections'

interface AppContextValue {
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  savedConnections: SavedConnection[]
  refreshSavedConnections: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [savedConnections, setSavedConnections] = useState<SavedConnection[]>([])

  const openDrawer = useCallback(() => setDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  const refreshSavedConnections = useCallback(async () => {
    try {
      const conns = await getSavedConnections()
      setSavedConnections(conns)
    } catch (e) {
      console.error('Error loading saved connections:', e)
    }
  }, [])

  useEffect(() => { refreshSavedConnections() }, [refreshSavedConnections])

  return (
    <AppContext.Provider value={{
      drawerOpen,
      openDrawer,
      closeDrawer,
      savedConnections,
      refreshSavedConnections,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}