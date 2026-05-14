import { useEffect, useRef } from 'react'
import { useToast } from '@/contexts/ToastContext'

export default function ToastContainer() {
  const { message, visible } = useToast()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (visible) el.textContent = message
  }, [message, visible])

  return (
    <div
      ref={ref}
      className={`fixed bottom-[84px] left-1/2 z-[2000] -translate-x-1/2 rounded-full border border-white/70 bg-slate-900/90 px-4 py-2.5 text-sm text-white shadow-[0_20px_40px_rgba(15,23,42,0.18)] transition-all duration-300 pointer-events-none whitespace-nowrap ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
      }`}
    />
  )
}
