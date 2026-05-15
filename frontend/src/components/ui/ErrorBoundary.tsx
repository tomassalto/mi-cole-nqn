import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[var(--bg)] p-8 text-center">
            <div className="rounded-2xl bg-[var(--surface)] p-8 shadow-lg">
              <span className="text-5xl">🚌</span>
              <h2 className="mt-4 text-xl font-bold text-[var(--text)]">
                Algo salió mal
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Ocurrió un error inesperado. Recargá la página para intentar de nuevo.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:brightness-110"
              >
                Recargar página
              </button>
              {import.meta.env.DEV && this.state.error && (
                <pre className="mt-4 max-w-md overflow-auto rounded-lg bg-slate-900 p-4 text-left text-xs text-red-400">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
