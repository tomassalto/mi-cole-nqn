import { useState, useRef, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import IconButton from '@/components/ui/IconButton'
import StopSearch from '@/components/ui/StopSearch'

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 lg:h-6 lg:w-6">
    <path d="M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0-2a1 1 0 0 0 1-1V3a1 1 0 0 0-2 0v1a1 1 0 0 0 1 1zm0 14a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1zm9-9h-1a1 1 0 0 0 0 2h1a1 1 0 0 0 0-2zM4 12a1 1 0 0 0-1-1H2a1 1 0 0 0 0 2h1a1 1 0 0 0 1-1zm14.95-7.364-.707-.707a1 1 0 0 0-1.414 1.414l.707.707a1 1 0 0 0 1.414-1.414zM6.757 17.657l-.707.707a1 1 0 0 0 1.414 1.414l.707-.707a1 1 0 0 0-1.414-1.414zm11.899 1.414.707-.707a1 1 0 0 0-1.414-1.414l-.707.707a1 1 0 0 0 1.414 1.414zM5.636 6.05l.707.707A1 1 0 0 0 7.757 5.343l-.707-.707A1 1 0 0 0 5.636 6.05z"/>
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 lg:h-6 lg:w-6">
    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
  </svg>
)

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 lg:h-6 lg:w-6">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

function UserDropdown({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-slate-200/80 bg-white/95 p-1 shadow-lg backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-800/95"
    >
      <div className="px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        {user?.username}
      </div>
      <div className="mx-2 border-t border-slate-200/60 dark:border-slate-700/50" />
      <button
        onClick={() => { logout(); onClose() }}
        className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Cerrar sesión
      </button>
    </div>
  )
}

export default function TopBar() {
  const { openDrawer, openConsultation, theme, toggleTheme } = useApp()
  const { user, openLoginModal } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header className="fixed left-0 right-0 top-0 z-[1000] h-[60px] border-b border-white/60 bg-white/75 px-3 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/80 md:px-4 lg:h-[72px] lg:px-6">
      <div className="flex h-full items-center gap-2 rounded-b-2xl border border-white/50 bg-white/50 px-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:border-slate-700/50 dark:bg-slate-800/50 dark:shadow-[0_12px_30px_rgba(0,0,0,0.30)] lg:gap-3 lg:px-4">
        <IconButton
          icon={<svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 lg:h-6 lg:w-6"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>}
          onClick={openDrawer}
          label="Paradas guardadas"
          className="lg:p-2"
        />
        <div className="flex-1 lg:text-lg">
          <StopSearch />
        </div>
        <IconButton
          icon={<svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 lg:h-6 lg:w-6"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6zm-6 0A4.5 4.5 0 1 1 10 5a4.5 4.5 0 0 1-.5 9z"/></svg>}
          onClick={openConsultation}
          label="Consultar viajes"
          className="lg:p-2"
        />
        <IconButton
          icon={theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          onClick={toggleTheme}
          label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          className="lg:p-2"
        />

        {/* User button */}
        <div className="relative">
          {user ? (
            <>
              <button
                onClick={() => setDropdownOpen(v => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 lg:h-9 lg:w-9 lg:text-sm"
                title={user.username}
              >
                {user.username[0].toUpperCase()}
              </button>
              {dropdownOpen && <UserDropdown onClose={() => setDropdownOpen(false)} />}
            </>
          ) : (
            <IconButton
              icon={<UserIcon />}
              onClick={openLoginModal}
              label="Iniciar sesión"
              className="lg:p-2"
            />
          )}
        </div>
      </div>
    </header>
  )
}
