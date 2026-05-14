import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { SavedConnection, SavedShortcut } from '@/types/api'
import { getSavedConnections } from '@/services/savedConnections'
import { getSavedShortcuts } from '@/services/savedShortcuts'

interface AppContextValue {
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  consultationOpen: boolean
  openConsultation: () => void
  closeConsultation: () => void
  savedConnections: SavedConnection[]
  savedShortcuts: SavedShortcut[]
  refreshSavedConnections: () => Promise<void>
  refreshSavedShortcuts: () => Promise<void>
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [consultationOpen, setConsultationOpen] = useState(false)
  const [savedConnections, setSavedConnections] = useState<SavedConnection[]>([])
  const [savedShortcuts, setSavedShortcuts] = useState<SavedShortcut[]>([])
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('micole-theme') : null
    if (saved === 'dark' || saved === 'light') return saved
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('micole-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => setTheme(t => t === 'light' ? 'dark' : 'light'), [])

  const openDrawer = useCallback(() => setDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const openConsultation = useCallback(() => setConsultationOpen(true), [])
  const closeConsultation = useCallback(() => setConsultationOpen(false), [])

  const refreshSavedConnections = useCallback(async () => {
    try {
      const conns = await getSavedConnections()
      setSavedConnections(conns)
    } catch (e) {
      console.error('Error loading saved connections:', e)
    }
  }, [])

  const refreshSavedShortcuts = useCallback(async () => {
    try {
      const shortcuts = await getSavedShortcuts()
      setSavedShortcuts(shortcuts)
    } catch (e) {
      console.error('Error loading saved shortcuts:', e)
    }
  }, [])

  useEffect(() => {
    refreshSavedConnections()
    refreshSavedShortcuts()
  }, [refreshSavedConnections, refreshSavedShortcuts])

  return (
    <AppContext.Provider value={{
      drawerOpen,
      openDrawer,
      closeDrawer,
      consultationOpen,
      openConsultation,
      closeConsultation,
      savedConnections,
      savedShortcuts,
      refreshSavedConnections,
      refreshSavedShortcuts,
      theme,
      toggleTheme,
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
