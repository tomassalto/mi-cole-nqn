import { useApp } from '@/contexts/AppContext'
import IconButton from '@/components/ui/IconButton'

export default function TopBar() {
  const { openDrawer } = useApp()

  return (
    <header className="fixed top-0 left-0 right-0 h-[52px] bg-[#1565c0] text-white flex items-center px-2 gap-2 z-[1000] shadow-[0_2px_12px_rgba(0,0,0,0.15)]">
      <IconButton
        icon={<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>}
        onClick={openDrawer}
        label="Paradas guardadas"
      />
      <span className="text-lg font-bold flex-1 tracking-wide">MiCole</span>
    </header>
  )
}