import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginModal() {
  const { showLoginModal, closeLoginModal, login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setUsername('')
    setPassword('')
    setError('')
    setSubmitting(false)
  }

  const handleClose = () => {
    reset()
    closeLoginModal()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (mode === 'login') {
        await login(username, password)
      } else {
        await register(username, password)
      }
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login')
    setError('')
  }

  return (
    <Modal
      open={showLoginModal}
      onClose={handleClose}
      title={mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-4 lg:p-5">
        {/* Username */}
        <div>
          <label className="mb-1 block text-xs fullhd:text-sm 2k:text-base font-medium text-slate-600 dark:text-slate-400">
            Usuario
          </label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="tu_usuario"
            autoComplete="username"
            autoFocus
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm fullhd:text-base 2k:text-lg text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-900/40 fullhd:px-4 fullhd:py-3"
          />
        </div>

        {/* Password */}
        <div>
          <label className="mb-1 block text-xs fullhd:text-sm 2k:text-base font-medium text-slate-600 dark:text-slate-400">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm fullhd:text-base 2k:text-lg text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-900/40 fullhd:px-4 fullhd:py-3"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs fullhd:text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !username || !password}
          className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm fullhd:text-base font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 fullhd:py-3"
        >
          {submitting
            ? (mode === 'login' ? 'Ingresando...' : 'Creando cuenta...')
            : (mode === 'login' ? 'Ingresar' : 'Crear cuenta')
          }
        </button>

        {/* Toggle mode */}
        <p className="text-center text-xs fullhd:text-sm text-slate-500 dark:text-slate-400">
          {mode === 'login' ? (
            <>
              ¿No tenés cuenta?{' '}
              <button type="button" onClick={toggleMode} className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                Registrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tenés cuenta?{' '}
              <button type="button" onClick={toggleMode} className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                Iniciá sesión
              </button>
            </>
          )}
        </p>
      </form>
    </Modal>
  )
}
