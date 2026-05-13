import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'

interface ToastContextValue {
  message: string
  visible: boolean
  show: (msg: string, ms?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((msg: string, ms = 2500) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessage(msg)
    setVisible(true)
    timerRef.current = setTimeout(() => setVisible(false), ms)
  }, [])

  return (
    <ToastContext.Provider value={{ message, visible, show }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}