import { useApp } from '@/contexts/AppContext'
import IconButton from '@/components/ui/IconButton'

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0-2a1 1 0 0 0 1-1V3a1 1 0 0 0-2 0v1a1 1 0 0 0 1 1zm0 14a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1zm9-9h-1a1 1 0 0 0 0 2h1a1 1 0 0 0 0-2zM4 12a1 1 0 0 0-1-1H2a1 1 0 0 0 0 2h1a1 1 0 0 0 1-1zm14.95-7.364-.707-.707a1 1 0 0 0-1.414 1.414l.707.707a1 1 0 0 0 1.414-1.414zM6.757 17.657l-.707.707a1 1 0 0 0 1.414 1.414l.707-.707a1 1 0 0 0-1.414-1.414zm11.899 1.414.707-.707a1 1 0 0 0-1.414-1.414l-.707.707a1 1 0 0 0 1.414 1.414zM5.636 6.05l.707.707A1 1 0 0 0 7.757 5.343l-.707-.707A1 1 0 0 0 5.636 6.05z"/>
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
  </svg>
)

export default function TopBar() {
  const { openDrawer, openConsultation, theme, toggleTheme } = useApp()

  return (
    <header className="fixed left-0 right-0 top-0 z-[1000] h-[60px] border-b border-white/60 bg-white/75 px-3 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/80 md:px-4">
      <div className="flex h-full items-center gap-3 rounded-b-2xl border border-white/50 bg-white/50 px-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:border-slate-700/50 dark:bg-slate-800/50 dark:shadow-[0_12px_30px_rgba(0,0,0,0.30)]">
        <IconButton
          icon={<svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>}
          onClick={openDrawer}
          label="Paradas guardadas"
        />
        <IconButton
          icon={<svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6zm-6 0A4.5 4.5 0 1 1 10 5a4.5 4.5 0 0 1-.5 9z"/></svg>}
          onClick={openConsultation}
          label="Consultar viajes"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">MiCole</span>
            <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/30 dark:text-emerald-400 md:inline-flex">
              Neuquén
            </span>
          </div>
          <p className="truncate text-[0.78rem] text-slate-500 dark:text-slate-400">Arribos, recorridos y combinaciones en un solo mapa</p>
        </div>
        <IconButton
          icon={theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          onClick={toggleTheme}
          label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        />
      </div>
    </header>
  )
}
