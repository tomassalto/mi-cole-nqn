import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AppProvider } from './contexts/AppContext'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { MapProvider } from './contexts/MapContext'
import { ToastProvider } from './contexts/ToastContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AppProvider>
        <FavoritesProvider>
          <MapProvider>
            <App />
          </MapProvider>
        </FavoritesProvider>
      </AppProvider>
    </ToastProvider>
  </StrictMode>,
)