import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { AppProvider } from './contexts/AppContext'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { MapProvider } from './contexts/MapContext'
import { ToastProvider } from './contexts/ToastContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AppProvider>
          <FavoritesProvider>
            <MapProvider>
              <App />
            </MapProvider>
          </FavoritesProvider>
        </AppProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
)