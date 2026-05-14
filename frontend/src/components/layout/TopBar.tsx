import { useApp } from '@/contexts/AppContext'
import IconButton from '@/components/ui/IconButton'

export default function TopBar() {
  const { openDrawer, openConsultation } = useApp()

  return (
    <header className="fixed left-0 right-0 top-0 z-[1000] h-[60px] border-b border-white/60 bg-white/75 px-3 backdrop-blur-xl md:px-4">
      <div className="flex h-full items-center gap-3 rounded-b-2xl border border-white/50 bg-white/50 px-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
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
            <span className="text-sm font-medium uppercase tracking-[0.32em] text-slate-500">MiCole</span>
            <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-emerald-700 md:inline-flex">
              Neuquén
            </span>
          </div>
          <p className="truncate text-[0.78rem] text-slate-500">Arribos, recorridos y combinaciones en un solo mapa</p>
        </div>
      </div>
    </header>
  )
}
