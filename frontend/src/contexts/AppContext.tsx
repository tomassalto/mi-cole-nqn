import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface AppContextValue {
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const openDrawer = useCallback(() => setDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  return (
    <AppContext.Provider value={{
      drawerOpen,
      openDrawer,
      closeDrawer,
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