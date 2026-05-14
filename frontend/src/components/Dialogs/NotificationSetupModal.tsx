interface NotificationSetupModalProps {
  shortcutName: string
  currentThreshold: number | null
  onConfirm: (minutesThreshold: number) => void
  onDisable: () => void
  onClose: () => void
}

const OPTIONS = [3, 5, 10, 15] as const

export default function NotificationSetupModal({
  shortcutName,
  currentThreshold,
  onConfirm,
  onDisable,
  onClose,
}: NotificationSetupModalProps) {
  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-t-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_-24px_60px_rgba(15,23,42,0.20)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95 sm:rounded-[28px]">
        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">
          Notificación
        </div>
        <h2 className="mb-1 truncate text-base font-semibold text-slate-900 dark:text-slate-100">
          {shortcutName}
        </h2>
        <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
          ¿Con cuánto tiempo de anticipación querés el aviso?
        </p>

        <div className="grid grid-cols-4 gap-2">
          {OPTIONS.map(mins => (
            <button
              key={mins}
              onClick={() => onConfirm(mins)}
              className={`rounded-2xl border py-3 text-sm font-semibold transition-colors ${
                currentThreshold === mins
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400'
              }`}
            >
              {mins} min
            </button>
          ))}
        </div>

        {currentThreshold != null && (
          <button
            onClick={onDisable}
            className="mt-3 w-full rounded-2xl border border-slate-200 py-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Desactivar notificación
          </button>
        )}

        <button
          onClick={onClose}
          className="mt-2 w-full rounded-2xl py-2.5 text-sm text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
