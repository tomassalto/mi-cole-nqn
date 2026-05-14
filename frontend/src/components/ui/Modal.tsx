import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

export default function Modal({ open, onClose, title, children, className = '' }: ModalProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-[900] bg-slate-950/45 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed left-1/2 top-1/2 z-[950] max-h-[calc(100dvh-2rem)] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_32px_90px_rgba(15,23,42,0.22)] backdrop-blur-xl transition-all duration-300 ${
          open ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-[0.98] opacity-0'
        } ${className}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-4">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </>
  )
}
