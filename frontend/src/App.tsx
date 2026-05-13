import TopBar from '@/components/layout/TopBar'
import ToastContainer from '@/components/layout/ToastContainer'
import MapView from '@/components/Map/MapView'
import ArrivalsPanel from '@/components/Panel/ArrivalsPanel'
import FavoritesDrawer from '@/components/Drawer/FavoritesDrawer'
import EtaDialog from '@/components/Dialogs/EtaDialog'
import ConnectionDialog from '@/components/Dialogs/ConnectionDialog'
import { useApp } from '@/contexts/AppContext'

export default function App() {
  const { savedConnections } = useApp()

  return (
    <div className="h-dvh flex flex-col">
      <TopBar />
      <MapView />
      <ToastContainer />
      <FavoritesDrawer />
      <ArrivalsPanel />
      <EtaDialog />
      <ConnectionDialog savedConnections={savedConnections} />
    </div>
  )
}