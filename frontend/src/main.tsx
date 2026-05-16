import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { AuthProvider } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { MapProvider } from './contexts/MapContext'
import { ToastProvider } from './contexts/ToastContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AppProvider>
            <FavoritesProvider>
              <MapProvider>
                <App />
              </MapProvider>
            </FavoritesProvider>
          </AppProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
)
