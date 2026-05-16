import TopBar from '@/components/layout/TopBar'
import ToastContainer from '@/components/layout/ToastContainer'
import MapView from '@/components/Map/MapView'
import ArrivalsPanel from '@/components/Panel/ArrivalsPanel'
import FavoritesDrawer from '@/components/Drawer/FavoritesDrawer'
import EtaDialog from '@/components/Dialogs/EtaDialog'
import ConnectionDialog from '@/components/Dialogs/ConnectionDialog'
import ShortcutDialog from '@/components/Dialogs/ShortcutDialog'
import ConsultationOverlay from '@/components/Dialogs/ConsultationOverlay'
import LoginModal from '@/components/Auth/LoginModal'

export default function App() {
  return (
    <div className="h-dvh flex flex-col">
      <TopBar />
      <MapView />
      <ToastContainer />
      <FavoritesDrawer />
      <ArrivalsPanel />
      <EtaDialog />
      <ConnectionDialog />
      <ShortcutDialog />
      <ConsultationOverlay />
      <LoginModal />
    </div>
  )
}
