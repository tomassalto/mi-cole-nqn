import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode
} from 'react'
import type { User } from '@/types/api'
import * as authService from '@/services/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  showLoginModal: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
  openLoginModal: () => void
  closeLoginModal: () => void
  requireAuth: (callback: () => void | Promise<void>) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const pendingActionRef = useRef<(() => void | Promise<void>) | null>(null)

  // Validate stored token on mount
  useEffect(() => {
    const token = authService.getToken()
    if (!token) {
      setLoading(false)
      return
    }
    authService.getMe()
      .then(u => setUser(u))
      .catch(() => authService.clearToken())
      .finally(() => setLoading(false))
  }, [])

  // Listen for 401 events from api.ts
  useEffect(() => {
    const handler = () => {
      setUser(null)
      authService.clearToken()
    }
    window.addEventListener('micole-auth-expired', handler)
    return () => window.removeEventListener('micole-auth-expired', handler)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const { token, user: u } = await authService.login(username, password)
    authService.setToken(token)
    setUser(u)
    setShowLoginModal(false)
    // Execute pending action if any
    if (pendingActionRef.current) {
      const action = pendingActionRef.current
      pendingActionRef.current = null
      await action()
    }
  }, [])

  const register = useCallback(async (username: string, password: string) => {
    const { token, user: u } = await authService.register(username, password)
    authService.setToken(token)
    setUser(u)
    setShowLoginModal(false)
    // Execute pending action if any
    if (pendingActionRef.current) {
      const action = pendingActionRef.current
      pendingActionRef.current = null
      await action()
    }
  }, [])

  const logout = useCallback(() => {
    authService.clearToken()
    setUser(null)
  }, [])

  const openLoginModal = useCallback(() => setShowLoginModal(true), [])

  const closeLoginModal = useCallback(() => {
    setShowLoginModal(false)
    pendingActionRef.current = null
  }, [])

  /** Returns true if user is authenticated. If not, opens login modal and queues callback. */
  const requireAuth = useCallback((callback: () => void | Promise<void>): boolean => {
    if (user) return true
    pendingActionRef.current = callback
    setShowLoginModal(true)
    return false
  }, [user])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      showLoginModal,
      login,
      register,
      logout,
      openLoginModal,
      closeLoginModal,
      requireAuth,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
