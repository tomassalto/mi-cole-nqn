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
        className={`fixed inset-0 bg-black/40 z-[900] transition-opacity duration-250 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.15)] z-[950] transition-all duration-250 ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        } ${className}`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#e5e7eb]">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#6b7280] text-lg hover:bg-[#f5f7fa] rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </>
  )
}