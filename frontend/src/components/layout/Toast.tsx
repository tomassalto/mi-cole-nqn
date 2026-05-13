import { useEffect, useRef } from 'react'

interface ToastProps {
  message: string
  visible: boolean
}

export default function Toast({ message, visible }: ToastProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.textContent = message
  }, [message])

  return (
    <div
      ref={ref}
      className={`
        fixed bottom-[76px] left-1/2 -translate-x-1/2
        bg-[#323232] text-white px-5 py-2.5 rounded-full text-sm
        transition-all duration-300 z-[2000] pointer-events-none
        whitespace-nowrap
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}
      `}
    >
      {visible ? message : ''}
    </div>
  )
}