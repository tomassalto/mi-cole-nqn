import { useEffect, useMemo, useState } from 'react'
import { useMap as useMapCtx } from '@/contexts/MapContext'
import { useApp } from '@/contexts/AppContext'
import Modal from '@/components/ui/Modal'
import { saveShortcut } from '@/services/savedShortcuts'
import { getShortcutLineCandidates } from '@/services/shortcuts'

export default function ShortcutDialog() {
  const {
    activeDialog,
    setActiveDialog,
    shortcutCreationStep,
    shortcutCreationData,
    setShortcutCreationStep,
    updateShortcutCreationData,
    cancelShortcutCreation,
    showRoute,
  } = useMapCtx()
  const { refreshSavedShortcuts } = useApp()
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)
  const [lineCandidates, setLineCandidates] = useState<Array<{ serviceId: number; routeCode: string; routeName: string }>>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)

  const open = activeDialog === 'shortcut'

  const selectedLine = useMemo(
    () => lineCandidates.find(line => line.serviceId === shortcutCreationData.lineServiceId) ?? null,
    [lineCandidates, shortcutCreationData.lineServiceId]
  )

  const beginPick = () => {
    setActiveDialog('none')
  }

  useEffect(() => {
    if (
      shortcutCreationStep === 'selectLine' &&
      shortcutCreationData.originStop &&
      shortcutCreationData.destStop
    ) {
      let cancelled = false
      setLoadingCandidates(true)
      getShortcutLineCandidates(Number(shortcutCreationData.originStop.id), Number(shortcutCreationData.destStop.id))
        .then(items => {
          if (!cancelled) {
            setLineCandidates(items)
            if (
              shortcutCreationData.lineServiceId &&
              !items.some(item => item.serviceId === shortcutCreationData.lineServiceId)
            ) {
              updateShortcutCreationData({ lineServiceId: null, lineRouteCode: '' })
            }
          }
        })
        .catch(() => {
          if (!cancelled) setLineCandidates([])
        })
        .finally(() => {
          if (!cancelled) setLoadingCandidates(false)
        })

      return () => { cancelled = true }
    }

    if (shortcutCreationStep !== 'selectLine') {
      setLineCandidates([])
      setLoadingCandidates(false)
    }
  }, [
    shortcutCreationStep,
    shortcutCreationData.originStop,
    shortcutCreationData.destStop,
    shortcutCreationData.lineServiceId,
    updateShortcutCreationData,
  ])

  const handleSave = async () => {
    if (!saveName.trim() || !shortcutCreationData.lineServiceId || !shortcutCreationData.originStop || !shortcutCreationData.destStop) return
    setSaving(true)
    try {
      await saveShortcut(
        saveName.trim(),
        shortcutCreationData.lineServiceId,
        shortcutCreationData.lineRouteCode,
        Number(shortcutCreationData.originStop.id),
        shortcutCreationData.originStop.name,
        Number(shortcutCreationData.destStop.id),
        shortcutCreationData.destStop.name
      )
      await refreshSavedShortcuts()
      cancelShortcutCreation()
      setSaveName('')
      setActiveDialog('none')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={() => { cancelShortcutCreation(); setActiveDialog('none') }}
      title="Nuevo atajo"
      className="w-[380px] max-h-[85vh] flex flex-col overflow-hidden bg-white/95 backdrop-blur-xl"
    >
      <div className="flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto p-4">
        {shortcutCreationStep === 'selectOrigin' && (
          <div>
            <button
              type="button"
              onClick={beginPick}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-slate-50"
            >
              <span className="block text-xs text-slate-500">Tocá para elegir la parada de subida</span>
              <span className="block text-sm font-medium text-slate-900">
                {shortcutCreationData.originStop?.name || 'Elegir en el mapa'}
              </span>
            </button>
            <p className="mt-3 text-sm text-slate-600">Al elegirla, el modal se cierra y el mapa queda escuchando la segunda parada.</p>
          </div>
        )}

        {shortcutCreationStep === 'selectLine' && (
          <div>
            <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Recorrido</p>
              <p className="font-medium text-slate-900">
                {shortcutCreationData.originStop?.name || 'Origen'} {'→'} {shortcutCreationData.destStop?.name || 'Destino'}
              </p>
            </div>
            <p className="mb-3 text-sm text-slate-600">Elegí la línea que pasa por ambas paradas.</p>
            {loadingCandidates && <p className="text-sm text-slate-500">Buscando líneas compatibles...</p>}
            {!loadingCandidates && lineCandidates.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                No encontré una línea común entre esas dos paradas.
              </div>
            )}
            {!loadingCandidates && lineCandidates.length > 0 && (
              <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
                {lineCandidates.map(line => (
                  <button
                    key={line.serviceId}
                    onClick={async () => {
                      updateShortcutCreationData({
                        lineServiceId: line.serviceId,
                        lineRouteCode: line.routeCode,
                      })
                      await showRoute(line.serviceId)
                    }}
                    className={`rounded-2xl border p-3 text-left shadow-sm transition-colors ${
                      shortcutCreationData.lineServiceId === line.serviceId
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-semibold text-slate-900">{line.routeCode}</span>
                    <span className="block text-xs text-slate-500">{line.routeName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {shortcutCreationStep === 'fillName' && (
          <div>
            <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Resumen</p>
              <p className="font-medium text-slate-900">
                {shortcutCreationData.originStop?.name} {'→'} {shortcutCreationData.destStop?.name}
              </p>
              <p className="text-xs text-slate-500">Línea {selectedLine?.routeCode ?? shortcutCreationData.lineRouteCode}</p>
            </div>
            <input
              type="text"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="Nombre del atajo (ej: Casa → Trabajo)"
              className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !saveName.trim() || !shortcutCreationData.lineServiceId}
                className="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar atajo'}
              </button>
              <button
                onClick={() => setShortcutCreationStep('selectLine')}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
              >
                Volver
              </button>
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2">
          <button
            onClick={() => {
              cancelShortcutCreation()
              setActiveDialog('none')
            }}
            className="text-sm text-slate-500 underline"
          >
            Cancelar
          </button>
          {shortcutCreationStep === 'selectLine' && shortcutCreationData.lineServiceId && (
            <button
              onClick={() => setShortcutCreationStep('fillName')}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white"
            >
              Continuar
            </button>
          )}
        </div>
        <div className="text-xs text-slate-500">
          {shortcutCreationStep === 'selectOrigin' && 'El mapa está escuchando la primera parada.'}
          {shortcutCreationStep === 'selectLine' && 'La línea se elige después de marcar ambas paradas.'}
        </div>
      </div>
    </Modal>
  )
}
