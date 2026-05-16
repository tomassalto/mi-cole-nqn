import { useState, useEffect, useRef } from 'react'
import { useMap as useMapCtx } from '@/contexts/MapContext'
import { useApp } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { calculateConnections } from '@/services/connections'
import { saveConnection } from '@/services/savedConnections'
import { getAvailableLines, type StopLine } from '@/services/arrivals'
import type { Connection, SavedConnection } from '@/types/api'

type PickStep = 'selectOrigin' | 'selectCombination' | 'selectBoardStop' | 'selectDest'

export default function ConnectionDialog() {
  const {
    activeDialog,
    setActiveDialog,
    connectionCreationStep,
    connectionCreationData,
    setConnectionCreationStep,
    updateConnectionCreationData,
    cancelConnectionCreation,
    startConnectionCreation,
    showRoute,
  } = useMapCtx()
  const { savedConnections, refreshSavedConnections } = useApp()
  const { requireAuth } = useAuth()
  const { show } = useToast()
  const [availableLinesA, setAvailableLinesA] = useState<StopLine[]>([])
  const [availableLinesB, setAvailableLinesB] = useState<StopLine[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [loadingConnections, setLoadingConnections] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)

  // When true, picking a stop from the map returns to editStops instead of the wizard flow
  const editModeRef = useRef(false)

  const open = activeDialog === 'connection'
  const isCreating = connectionCreationStep !== 'idle'
  const isSavedView = connectionCreationStep === 'viewSaved'
  const isEditStops = connectionCreationStep === 'editStops'

  const dialogTitle = isSavedView
    ? 'Mejor combinación'
    : isEditStops
      ? 'Editar conexión'
      : connectionCreationStep === 'fillName'
        ? 'Guardar conexión'
        : 'Nueva conexión'

  useEffect(() => {
    if (!open && connectionCreationStep === 'idle') {
      setConnections([])
      setSaveName('')
      editModeRef.current = false
    }
  }, [open, connectionCreationStep])

  // Entering editStops means we're in edit mode
  useEffect(() => {
    if (connectionCreationStep === 'editStops') {
      editModeRef.current = true
    }
  }, [connectionCreationStep])

  useEffect(() => {
    if (connectionCreationStep === 'selectLineA' && connectionCreationData.originStop) {
      getAvailableLines(Number(connectionCreationData.originStop.id))
        .then(lines => {
          if (lines.length === 0) {
            show('No hay líneas en esta parada')
            setConnectionCreationStep(editModeRef.current ? 'editStops' : 'selectOrigin')
          } else {
            setAvailableLinesA(lines)
          }
        })
        .catch(() => {
          show('Error obteniendo líneas')
          setConnectionCreationStep(editModeRef.current ? 'editStops' : 'selectOrigin')
        })
    }
  }, [connectionCreationStep, connectionCreationData.originStop, show, setConnectionCreationStep])

  useEffect(() => {
    if (connectionCreationStep === 'selectLineB' && connectionCreationData.boardStop) {
      getAvailableLines(Number(connectionCreationData.boardStop.id))
        .then(lines => {
          if (lines.length === 0) {
            show('No hay líneas en esta parada')
            setConnectionCreationStep(editModeRef.current ? 'editStops' : 'selectBoardStop')
          } else {
            setAvailableLinesB(lines)
          }
        })
        .catch(() => {
          show('Error obteniendo líneas')
          setConnectionCreationStep(editModeRef.current ? 'editStops' : 'selectBoardStop')
        })
    }
  }, [connectionCreationStep, connectionCreationData.boardStop, show, setConnectionCreationStep])

  useEffect(() => {
    if (
      connectionCreationStep === 'viewSaved' &&
      connectionCreationData.originStop &&
      connectionCreationData.combinationStop &&
      connectionCreationData.boardStop &&
      connectionCreationData.destStop &&
      connectionCreationData.lineAServiceId &&
      connectionCreationData.lineBServiceId
    ) {
      setConnections([])
      setLoadingConnections(true)
      calculateConnections(
        Number(connectionCreationData.originStop.id),
        Number(connectionCreationData.combinationStop.id),
        Number(connectionCreationData.boardStop.id),
        Number(connectionCreationData.destStop.id),
        connectionCreationData.lineAServiceId,
        connectionCreationData.lineBServiceId
      )
        .then(results => setConnections(results.slice(0, 5)))
        .catch(() => show('Error calculando conexiones'))
        .finally(() => setLoadingConnections(false))
    }
  }, [
    connectionCreationStep,
    connectionCreationData.originStop,
    connectionCreationData.combinationStop,
    connectionCreationData.boardStop,
    connectionCreationData.destStop,
    connectionCreationData.lineAServiceId,
    connectionCreationData.lineBServiceId,
    show,
  ])

  // In edit mode, picking a stop goes to the map then back to editStops
  const beginPick = (step: PickStep) => {
    setConnectionCreationStep(step)
    setActiveDialog('none')
  }

  // Where "back" goes: editStops if editing, or normal wizard prev step
  const backTarget = (normalTarget: string): string =>
    editModeRef.current ? 'editStops' : normalTarget

  const handleSaveConnection = async () => {
    if (
      !saveName.trim() ||
      !connectionCreationData.originStop ||
      !connectionCreationData.combinationStop ||
      !connectionCreationData.boardStop ||
      !connectionCreationData.destStop ||
      !connectionCreationData.lineAServiceId ||
      !connectionCreationData.lineBServiceId
    ) return

    if (!requireAuth(() => handleSaveConnection())) return

    setSaving(true)
    try {
      await saveConnection(
        saveName.trim(),
        Number(connectionCreationData.originStop.id),
        connectionCreationData.originStop.name,
        Number(connectionCreationData.combinationStop.id),
        connectionCreationData.combinationStop.name,
        Number(connectionCreationData.boardStop.id),
        connectionCreationData.boardStop.name,
        Number(connectionCreationData.destStop.id),
        connectionCreationData.destStop.name,
        connectionCreationData.lineAServiceId,
        connectionCreationData.lineARouteCode,
        connectionCreationData.lineBServiceId,
        connectionCreationData.lineBRouteCode
      )
      await refreshSavedConnections()
      show('Conexión guardada')
      editModeRef.current = false
      cancelConnectionCreation()
      setSaveName('')
    } catch {
      show('Error guardando conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleLoadConnection = (conn: SavedConnection) => {
    setConnections([])
    editModeRef.current = false
    updateConnectionCreationData({
      originStop: { id: conn.origin_stop_id, name: conn.origin_stop_name ?? '', lat: 0, lon: 0 },
      lineAServiceId: conn.line_a_service_id,
      lineARouteCode: conn.line_a_route_code ?? '',
      combinationStop: { id: conn.transfer_stop_a_id ?? conn.origin_stop_id, name: conn.transfer_stop_a_name ?? '', lat: 0, lon: 0 },
      lineBServiceId: conn.line_b_service_id,
      lineBRouteCode: conn.line_b_route_code ?? '',
      boardStop: { id: conn.board_stop_id ?? conn.dest_stop_id, name: conn.board_stop_name ?? '', lat: 0, lon: 0 },
      destStop: { id: conn.dest_stop_id, name: conn.dest_stop_name ?? '', lat: 0, lon: 0 },
    })
    setSaveName(conn.name)
    setConnectionCreationStep('viewSaved')
    setActiveDialog('connection')
  }

  const handleClose = () => {
    editModeRef.current = false
    cancelConnectionCreation()
    setActiveDialog('none')
  }

  const podiumColors = [
    { bg: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-600/40', icon: '🥇' },
    { bg: 'bg-slate-50 border-slate-300 dark:bg-slate-800/30 dark:border-slate-600/40', icon: '🥈' },
    { bg: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700/40', icon: '🥉' },
  ]

  // ── Shared UI helpers ─────────────────────────────────────────────

  const infoBox = (label: string, value: string | null) => (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/50 lg:p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-medium text-slate-900 dark:text-slate-100 lg:text-base">{value || 'Sin seleccionar'}</p>
    </div>
  )

  const stopPicker = (label: string, value: string | null, step: PickStep, hint: string) => (
    <div className="py-1">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</label>
      <button
        type="button"
        onClick={() => beginPick(step)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 lg:px-5 lg:py-4"
      >
        <span className="block text-xs text-slate-500 dark:text-slate-400">{hint}</span>
        <span className="block text-sm font-medium text-slate-900 dark:text-slate-100 lg:text-base">{value || 'Elegir en el mapa'}</span>
      </button>
    </div>
  )

  const lineButton = (line: StopLine, onClick: () => void) => (
    <button
      key={line.serviceId}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 lg:p-4"
    >
      <Badge routeCode={line.routeCode} size="sm" />
      <span className="truncate text-sm text-slate-700 dark:text-slate-300 lg:text-base">{line.routeName}</span>
    </button>
  )

  const backLink = (onClick: () => void, label = 'Volver') => (
    <button onClick={onClick} className="mt-3 text-sm text-slate-500 underline transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
      {label}
    </button>
  )

  const primaryBtn = (label: string, onClick: () => void, disabled = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:disabled:opacity-40 lg:px-6 lg:py-3 lg:text-base"
    >
      {label}
    </button>
  )

  const secondaryBtn = (label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:px-5 lg:py-3 lg:text-base"
    >
      {label}
    </button>
  )

  // ── Connection result card ────────────────────────────────────────

  const renderConnectionResult = (conn: Connection, index: number) => {
    const isPodium = index < 3
    const colors = podiumColors[index] ?? podiumColors[2]
    return (
      <div
        key={`${conn.lineATime}-${conn.lineBTime}-${index}`}
        className={`relative rounded-2xl border p-3.5 text-sm shadow-sm transition-all lg:p-4 ${
          isPodium ? colors.bg : 'border-slate-200/70 bg-white/60 dark:border-slate-700/50 dark:bg-slate-800/40'
        }`}
      >
        {/* Header */}
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {isPodium ? (
              <span className="text-lg leading-none">{colors.icon}</span>
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] lg:text-[11px] fullhd:text-xs 2k:text-sm font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                {index + 1}
              </span>
            )}
            <span className="font-semibold text-slate-900 dark:text-slate-100 lg:text-base">
              Opción {index + 1}
            </span>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
            conn.waitMins <= 5
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
              : conn.waitMins <= 10
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
          }`}>
            Espera {conn.waitMins} min
          </span>
        </div>

        {/* 4-stop timeline */}
        <div className="flex items-start gap-2 lg:gap-3">
          <div className="flex flex-col items-center pt-[3px]">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <div className="h-6 w-0.5 bg-blue-300/60 dark:bg-blue-700/60 lg:h-7" />
            <div className="h-2.5 w-2.5 rounded-full bg-blue-300 dark:bg-blue-600" />
            <div className="h-6 w-0.5 bg-amber-300/60 dark:bg-amber-700/40 lg:h-7" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <div className="h-6 w-0.5 bg-emerald-300/60 dark:bg-emerald-700/60 lg:h-7" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-300 dark:bg-emerald-600" />
          </div>
          <div className="min-w-0 flex-1 text-xs lg:text-sm">
            <div className="flex items-center gap-1.5">
              <Badge routeCode={connectionCreationData.lineARouteCode || '?'} size="sm" />
              <span className="font-semibold text-blue-600 dark:text-blue-400">{conn.lineATime}</span>
              <span className="truncate text-slate-600 dark:text-slate-300">{connectionCreationData.originStop?.name}</span>
            </div>
            <div className="flex h-6 items-center gap-1.5 lg:h-7">
              <span className="font-medium text-blue-400 dark:text-blue-500">{conn.transferTime}</span>
              <span className="truncate text-slate-500 dark:text-slate-400">{connectionCreationData.combinationStop?.name}</span>
            </div>
            <div className="flex h-6 items-center gap-1.5 lg:h-7">
              <span className="text-amber-500">⇄</span>
              <span className="text-[10px] lg:text-[11px] fullhd:text-xs 2k:text-sm font-medium text-amber-600 dark:text-amber-400">
                Transbordo · {conn.waitMins} min
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge routeCode={connectionCreationData.lineBRouteCode || '?'} size="sm" />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{conn.lineBTime}</span>
              <span className="truncate text-slate-600 dark:text-slate-300">{connectionCreationData.boardStop?.name}</span>
            </div>
            <div className="flex h-6 items-center gap-1.5 lg:h-7">
              <span className="font-medium text-emerald-400 dark:text-emerald-500">{conn.finalTime}</span>
              <span className="truncate text-slate-500 dark:text-slate-400">{connectionCreationData.destStop?.name}</span>
            </div>
          </div>
        </div>

        {/* Wait bar */}
        <div className="mt-2.5 flex items-center gap-2">
          <span className="text-[10px] lg:text-[11px] fullhd:text-xs 2k:text-sm text-slate-400">Espera</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (conn.waitMins / 20) * 100)}%`,
                backgroundColor: conn.waitMins <= 5 ? '#10b981' : conn.waitMins <= 10 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
          <span className="text-[10px] lg:text-[11px] fullhd:text-xs 2k:text-sm font-medium text-slate-500 dark:text-slate-400">
            {conn.totalMins} min total
          </span>
        </div>
      </div>
    )
  }

  // ── Connection summary card ───────────────────────────────────────

  const renderConnectionSummary = () => (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left dark:border-slate-700 dark:bg-slate-800/50 lg:p-4">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Ruta configurada</p>
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <Badge routeCode={connectionCreationData.lineARouteCode || '?'} size="sm" />
          </div>
          <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-1">
              <span className="mt-px text-emerald-500">▲</span>
              <span className="truncate">{connectionCreationData.originStop?.name || 'Origen'}</span>
            </div>
            <div className="flex items-start gap-1">
              <span className="mt-px text-rose-400">▼</span>
              <span className="truncate">{connectionCreationData.combinationStop?.name || 'Combinación'}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <span className="text-xs text-slate-300 dark:text-slate-600">→</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <Badge routeCode={connectionCreationData.lineBRouteCode || '?'} size="sm" />
          </div>
          <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-1">
              <span className="mt-px text-emerald-500">▲</span>
              <span className="truncate">{connectionCreationData.boardStop?.name || 'Subida'}</span>
            </div>
            <div className="flex items-start gap-1">
              <span className="mt-px text-rose-400">▼</span>
              <span className="truncate">{connectionCreationData.destStop?.name || 'Destino'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // ── Edit choice view ───────────────────────────────────────────────

  const renderEditStops = () => {
    return (
      <div className="space-y-4">
        {/* Show current connection info */}
        {renderConnectionSummary()}

        <p className="text-sm text-slate-600 dark:text-slate-400">
          ¿Qué querés modificar?
        </p>

        {/* Edit name */}
        <button
          onClick={() => setConnectionCreationStep('fillName')}
          className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 lg:p-5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg dark:bg-blue-900/40">✏️</span>
          <div>
            <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100 lg:text-base">Editar nombre</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Cambiar solo el nombre de la conexión</span>
          </div>
        </button>

        {/* Edit route (restart wizard) */}
        <button
          onClick={() => {
            editModeRef.current = false
            setConnectionCreationStep('selectOrigin')
          }}
          className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 lg:p-5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg dark:bg-amber-900/40">🗺️</span>
          <div>
            <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100 lg:text-base">Editar ruta</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Volver a elegir paradas y líneas desde el principio</span>
          </div>
        </button>

        <div className="pt-1">
          {secondaryBtn('Cancelar', handleClose)}
        </div>
      </div>
    )
  }

  // ── Step renderer ─────────────────────────────────────────────────

  const renderStep = () => {
    if (connectionCreationStep === 'selectOrigin') {
      return (
        <div>
          {stopPicker('Salida línea A', connectionCreationData.originStop?.name ?? null, 'selectOrigin', 'Tocá para elegir la parada de origen')}
          {backLink(() => {
            if (editModeRef.current) { setConnectionCreationStep('editStops') }
            else { handleClose() }
          }, editModeRef.current ? 'Volver a edición' : 'Cancelar')}
        </div>
      )
    }

    if (connectionCreationStep === 'selectLineA') {
      return (
        <div>
          {infoBox('Salida línea A', connectionCreationData.originStop?.name ?? null)}
          <p className="mb-2 mt-4 text-sm font-medium text-slate-900 dark:text-slate-100 lg:text-base">¿Qué línea tomás?</p>
          <div className="flex max-h-48 flex-col gap-2 overflow-y-auto lg:max-h-64">
            {availableLinesA.map(line =>
              lineButton(line, async () => {
                updateConnectionCreationData({ lineAServiceId: line.serviceId, lineARouteCode: line.routeCode })
                await showRoute(line.serviceId)
                setConnectionCreationStep(editModeRef.current ? 'editStops' : 'selectCombination')
              })
            )}
          </div>
          {backLink(() => setConnectionCreationStep(backTarget('selectOrigin') as never))}
        </div>
      )
    }

    if (connectionCreationStep === 'selectCombination') {
      return (
        <div>
          {stopPicker('Bajada línea A', connectionCreationData.combinationStop?.name ?? null, 'selectCombination', 'Tocá para elegir dónde te bajás')}
          {backLink(() => setConnectionCreationStep(backTarget('selectLineA') as never))}
        </div>
      )
    }

    if (connectionCreationStep === 'selectBoardStop') {
      return (
        <div>
          {stopPicker('Subida línea B', connectionCreationData.boardStop?.name ?? null, 'selectBoardStop', 'Tocá para elegir dónde subís a la segunda línea')}
          {backLink(() => setConnectionCreationStep(backTarget('selectCombination') as never))}
        </div>
      )
    }

    if (connectionCreationStep === 'selectLineB') {
      return (
        <div>
          {infoBox('Subida línea B', connectionCreationData.boardStop?.name ?? null)}
          <p className="mb-2 mt-4 text-sm font-medium text-slate-900 dark:text-slate-100 lg:text-base">¿Qué línea tomás?</p>
          <div className="flex max-h-48 flex-col gap-2 overflow-y-auto lg:max-h-64">
            {availableLinesB.map(line =>
              lineButton(line, async () => {
                updateConnectionCreationData({ lineBServiceId: line.serviceId, lineBRouteCode: line.routeCode })
                await showRoute(line.serviceId)
                setConnectionCreationStep(editModeRef.current ? 'editStops' : 'selectDest')
              })
            )}
          </div>
          {backLink(() => setConnectionCreationStep(backTarget('selectBoardStop') as never))}
        </div>
      )
    }

    if (connectionCreationStep === 'selectDest') {
      return (
        <div>
          {stopPicker('Destino final', connectionCreationData.destStop?.name ?? null, 'selectDest', 'Tocá para elegir la parada destino')}

          {!editModeRef.current && connectionCreationData.destStop && (
            <div className="mt-4">
              {renderConnectionSummary()}
            </div>
          )}

          <div className="mt-4 flex justify-center gap-2">
            {editModeRef.current ? (
              backLink(() => setConnectionCreationStep('editStops'), 'Volver a edición')
            ) : (
              <>
                {primaryBtn('Guardar conexión', () => setConnectionCreationStep('fillName'), !connectionCreationData.destStop)}
                {secondaryBtn('Volver', () => setConnectionCreationStep('selectLineB'))}
              </>
            )}
          </div>
        </div>
      )
    }

    if (connectionCreationStep === 'viewSaved') {
      return (
        <div>
          {renderConnectionSummary()}
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/60 lg:p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Recomendación</p>
            {loadingConnections && (
              <div className="mt-3 animate-pulse space-y-2">
                <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            )}
            {!loadingConnections && connections.length === 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No hay combinación útil ahora.</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Puede pasar si no hay servicios compatibles o la espera es muy larga.</p>
              </div>
            )}
            {!loadingConnections && connections.length > 0 && (
              <div className="mt-3 space-y-2.5">
                {connections.map((c, i) => renderConnectionResult(c, i))}
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            {secondaryBtn('Editar', () => {
              editModeRef.current = true
              setConnectionCreationStep('editStops')
            })}
            {primaryBtn('Cerrar', handleClose)}
          </div>
        </div>
      )
    }

    if (connectionCreationStep === 'editStops') {
      return renderEditStops()
    }

    if (connectionCreationStep === 'fillName') {
      const canSave =
        saveName.trim() &&
        connectionCreationData.originStop &&
        connectionCreationData.combinationStop &&
        connectionCreationData.boardStop &&
        connectionCreationData.destStop &&
        connectionCreationData.lineAServiceId &&
        connectionCreationData.lineBServiceId

      // If we came from editStops, go back there; if from the new wizard, go to selectDest
      const fillNameBack = editModeRef.current ? 'editStops' : 'selectDest'

      return (
        <div>
          {renderConnectionSummary()}
          <div className="mt-3">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Nombre</label>
            <input
              type="text"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="Nombre (ej: Casa → Trabajo)"
              className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 lg:px-4 lg:py-3 lg:text-base"
              onKeyDown={e => e.key === 'Enter' && canSave && !saving && handleSaveConnection()}
            />
          </div>
          <div className="flex gap-2">
            {primaryBtn(saving ? 'Guardando...' : 'Guardar', handleSaveConnection, !canSave || saving)}
            {secondaryBtn('Volver', () => setConnectionCreationStep(fillNameBack as never))}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={dialogTitle}
    >
      <div className="flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto p-4 lg:gap-4 lg:p-5">
        {isCreating ? (
          renderStep()
        ) : (
          <>
            <button
              onClick={startConnectionCreation}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 lg:py-3.5 lg:text-base"
            >
              + Nueva conexión
            </button>
            {savedConnections.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Conexiones guardadas</p>
                <div className="flex max-h-48 flex-col gap-1 overflow-y-auto lg:max-h-64">
                  {savedConnections.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleLoadConnection(c)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 lg:px-4 lg:py-3"
                    >
                      <span className="block font-medium text-slate-900 dark:text-slate-100 lg:text-base">{c.name}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{c.line_a_route_code} → {c.line_b_route_code}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
