import { useState, useEffect } from 'react'
import { useMap as useMapCtx } from '@/contexts/MapContext'
import { useApp } from '@/contexts/AppContext'
import { useToast } from '@/contexts/ToastContext'
import Modal from '@/components/ui/Modal'
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
  const { show } = useToast()
  const [availableLinesA, setAvailableLinesA] = useState<StopLine[]>([])
  const [availableLinesB, setAvailableLinesB] = useState<StopLine[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [loadingConnections, setLoadingConnections] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)

  const open = activeDialog === 'connection'
  const isCreating = connectionCreationStep !== 'idle'
  const isSavedView = connectionCreationStep === 'viewSaved'
  const dialogTitle = isSavedView
    ? 'Mejor combinacion'
    : connectionCreationStep === 'fillName'
      ? 'Editar conexion'
      : 'Nueva conexion'

  useEffect(() => {
    if (!open && connectionCreationStep === 'idle') {
      setConnections([])
      setSaveName('')
    }
  }, [open, connectionCreationStep])

  useEffect(() => {
    if (connectionCreationStep === 'selectLineA' && connectionCreationData.originStop) {
      getAvailableLines(Number(connectionCreationData.originStop.id))
        .then(lines => {
          if (lines.length === 0) {
            show('No hay lineas en esta parada')
            setConnectionCreationStep('selectOrigin')
          } else {
            setAvailableLinesA(lines)
          }
        })
        .catch(() => {
          show('Error obteniendo lineas')
          setConnectionCreationStep('selectOrigin')
        })
    }
  }, [connectionCreationStep, connectionCreationData.originStop, show, setConnectionCreationStep])

  useEffect(() => {
    if (connectionCreationStep === 'selectLineB' && connectionCreationData.combinationStop) {
      getAvailableLines(Number(connectionCreationData.combinationStop.id))
        .then(lines => {
          if (lines.length === 0) {
            show('No hay lineas en esta parada')
            setConnectionCreationStep('selectCombination')
          } else {
            setAvailableLinesB(lines)
          }
        })
        .catch(() => {
          show('Error obteniendo lineas')
          setConnectionCreationStep('selectCombination')
        })
    }
  }, [connectionCreationStep, connectionCreationData.combinationStop, show, setConnectionCreationStep])

  useEffect(() => {
    if (
      (connectionCreationStep === 'selectDest' || connectionCreationStep === 'viewSaved') &&
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
        .then(results => {
          setConnections(results.slice(0, 5))
        })
        .catch(() => {
          show('Error calculando conexiones')
        })
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

  const beginPick = (step: PickStep) => {
    setConnectionCreationStep(step)
    setActiveDialog('none')
  }

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
      show('Conexion guardada')
      cancelConnectionCreation()
      setSaveName('')
    } catch {
      show('Error guardando conexion')
    } finally {
      setSaving(false)
    }
  }

  const handleLoadConnection = (conn: SavedConnection) => {
    setConnections([])
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

  const renderConnections = () => {
    if (connections.length === 0) return null
    return (
      <div className="mt-3 space-y-2">
        {connections.map((conn, index) => (
          <div key={`${conn.lineATime}-${conn.lineBTime}-${index}`} className="rounded-2xl border border-white/70 bg-white/80 p-3 text-sm shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-slate-900">Opcion {index + 1}</span>
              <span className="text-xs text-slate-500">Espera {conn.waitMins} min</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <span>A sale {conn.lineATime}</span>
              <span>Transborda {conn.transferTime}</span>
              <span>B sube {conn.lineBTime}</span>
              <span>Llega {conn.finalTime || 'n/d'}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderConnectionSummary = () => (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ruta guardada</p>
      <div className="space-y-1 text-sm text-slate-700">
        <p><span className="font-medium text-slate-900">Nombre:</span> {saveName || 'Sin nombre'}</p>
        <p><span className="font-medium text-slate-900">Origen:</span> {connectionCreationData.originStop?.name || 'Sin seleccionar'}</p>
        <p><span className="font-medium text-slate-900">Bajada A:</span> {connectionCreationData.combinationStop?.name || 'Sin seleccionar'}</p>
        <p><span className="font-medium text-slate-900">Subida B:</span> {connectionCreationData.boardStop?.name || 'Sin seleccionar'}</p>
        <p><span className="font-medium text-slate-900">Destino:</span> {connectionCreationData.destStop?.name || 'Sin seleccionar'}</p>
        <p><span className="font-medium text-slate-900">Lineas:</span> {connectionCreationData.lineARouteCode || 'Sin linea'} {'->'} {connectionCreationData.lineBRouteCode || 'Sin linea'}</p>
      </div>
    </div>
  )

  const stopPicker = (label: string, value: string | null, step: PickStep, hint: string) => (
    <div className="py-1">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</label>
      <button
        type="button"
        onClick={() => beginPick(step)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-slate-50"
      >
        <span className="block text-xs text-slate-500">{hint}</span>
        <span className="block text-sm font-medium text-slate-900">{value || 'Elegir en el mapa'}</span>
      </button>
    </div>
  )

  const renderStep = () => {
    if (connectionCreationStep === 'selectOrigin') {
      return (
        <div>
          {stopPicker('Salida linea A', connectionCreationData.originStop?.name ?? null, 'selectOrigin', 'Toca para elegir la parada de origen')}
          <button onClick={() => { cancelConnectionCreation(); setActiveDialog('none') }} className="mt-3 text-sm text-slate-500 underline">Cancelar</button>
        </div>
      )
    }

    if (connectionCreationStep === 'selectLineA') {
      return (
        <div>
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Salida linea A</p>
            <p className="font-medium text-slate-900">{connectionCreationData.originStop?.name || 'Sin seleccionar'}</p>
          </div>
          <p className="mb-2 text-sm font-medium">Que linea tomas?</p>
          <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
            {availableLinesA.map(line => (
              <button
                key={line.serviceId}
                onClick={async () => {
                  updateConnectionCreationData({ lineAServiceId: line.serviceId, lineARouteCode: line.routeCode })
                  await showRoute(line.serviceId)
                  setConnectionCreationStep('selectCombination')
                }}
                className="rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-colors hover:bg-slate-50"
              >
                <span className="font-bold text-slate-900">{line.routeCode}</span>
                <span className="ml-2 text-xs text-slate-500">{line.routeName}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setConnectionCreationStep('selectOrigin')} className="mt-3 text-sm text-slate-500 underline">Volver</button>
        </div>
      )
    }

    if (connectionCreationStep === 'selectCombination') {
      return (
        <div>
          {stopPicker('Bajada linea A', connectionCreationData.combinationStop?.name ?? null, 'selectCombination', 'Toca para elegir donde te bajas')}
          <button onClick={() => setConnectionCreationStep('selectLineA')} className="mt-3 text-sm text-slate-500 underline">Volver</button>
        </div>
      )
    }

    if (connectionCreationStep === 'selectLineB') {
      return (
        <div>
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Bajada linea A</p>
            <p className="font-medium text-slate-900">{connectionCreationData.combinationStop?.name || 'Sin seleccionar'}</p>
          </div>
          <p className="mb-2 text-sm font-medium">Que linea tomas despues?</p>
          <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
            {availableLinesB.map(line => (
              <button
                key={line.serviceId}
                onClick={async () => {
                  updateConnectionCreationData({ lineBServiceId: line.serviceId, lineBRouteCode: line.routeCode })
                  await showRoute(line.serviceId)
                  setConnectionCreationStep('selectBoardStop')
                }}
                className="rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-colors hover:bg-slate-50"
              >
                <span className="font-bold text-slate-900">{line.routeCode}</span>
                <span className="ml-2 text-xs text-slate-500">{line.routeName}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setConnectionCreationStep('selectCombination')} className="mt-3 text-sm text-slate-500 underline">Volver</button>
        </div>
      )
    }

    if (connectionCreationStep === 'selectBoardStop') {
      return (
        <div>
          {stopPicker('Subida linea B', connectionCreationData.boardStop?.name ?? null, 'selectBoardStop', 'Toca para elegir donde subis a la segunda linea')}
          <button onClick={() => setConnectionCreationStep('selectLineB')} className="mt-3 text-sm text-slate-500 underline">Volver</button>
        </div>
      )
    }

    if (connectionCreationStep === 'selectDest') {
      return (
        <div>
          {stopPicker('Destino final', connectionCreationData.destStop?.name ?? null, 'selectDest', 'Toca para elegir la parada destino')}
          {connectionCreationData.destStop ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left">
              {loadingConnections && <p className="mt-2 text-xs text-slate-500">Calculando...</p>}
              {!loadingConnections && connections.length > 0 && (
                <p className="mt-2 text-sm text-slate-900">Mejor salida: <strong>{connections[0].waitMins} min</strong> de espera.</p>
              )}
              {!loadingConnections && connections.length === 0 && (
                <p className="mt-2 text-sm text-slate-600">No hay una combinacion compatible con estos horarios.</p>
              )}
              {!loadingConnections && renderConnections()}
            </div>
          ) : null}
          <div className="mt-3 flex justify-center gap-2">
            <button onClick={() => setConnectionCreationStep('fillName')} className="rounded-xl bg-slate-100 px-4 py-2 text-sm">Continuar</button>
            <button onClick={() => setConnectionCreationStep('selectBoardStop')} className="text-sm text-slate-500 underline">Volver</button>
          </div>
        </div>
      )
    }

    if (connectionCreationStep === 'viewSaved') {
      return (
        <div>
          {renderConnectionSummary()}
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recomendacion</p>
            {loadingConnections && (
              <p className="mt-2 text-sm text-slate-600">Buscando la mejor coincidencia con los horarios disponibles...</p>
            )}
            {!loadingConnections && connections.length === 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium text-slate-900">No hay una combinacion util ahora mismo.</p>
                <p className="text-sm text-slate-600">Puede pasar si no hay servicios compatibles o si en esta franja no aparece una espera razonable.</p>
              </div>
            )}
            {!loadingConnections && connections.length > 0 && (
              <>
                <p className="mt-2 text-sm text-slate-900">Mejor espera: <strong>{connections[0].waitMins} min</strong>.</p>
                {renderConnections()}
              </>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setConnectionCreationStep('fillName')}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
            >
              Editar conexion
            </button>
            <button
              onClick={() => { cancelConnectionCreation(); setActiveDialog('none') }}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      )
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

      return (
        <div>
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left">
            <p className="mb-2 text-xs text-slate-500">Resumen:</p>
            <p className="text-sm"><strong>{connectionCreationData.originStop?.name}</strong> - <strong>{connectionCreationData.lineARouteCode}</strong></p>
            <p className="text-sm"><strong>{connectionCreationData.combinationStop?.name}</strong> - <strong>{connectionCreationData.lineBRouteCode}</strong></p>
            <p className="text-sm">Board: <strong>{connectionCreationData.boardStop?.name}</strong></p>
            {connectionCreationData.destStop && <p className="text-sm text-slate-900">Destino: {connectionCreationData.destStop.name}</p>}
          </div>
          <input
            type="text"
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            placeholder="Nombre (ej: Casa -> Trabajo)"
            className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            onKeyDown={e => e.key === 'Enter' && canSave && !saving && handleSaveConnection()}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveConnection}
              disabled={!canSave || saving}
              className="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar conexion'}
            </button>
            <button onClick={() => setConnectionCreationStep('selectDest')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">
              Volver
            </button>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <Modal
      open={open}
      onClose={() => { cancelConnectionCreation(); setActiveDialog('none') }}
      title={dialogTitle}
      className="w-[380px] max-h-[85vh] flex flex-col overflow-hidden bg-white/95 backdrop-blur-xl"
    >
      <div className="flex flex-1 min-h-0 flex-col gap-3 overflow-y-auto p-4">
        {isCreating ? (
          renderStep()
        ) : (
          <>
            <button
              onClick={startConnectionCreation}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              + Nueva conexion
            </button>
            {savedConnections.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Conexiones guardadas</p>
                <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                  {savedConnections.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleLoadConnection(c)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50"
                    >
                      <span className="block font-medium text-slate-900">{c.name}</span>
                      <span className="block text-xs text-slate-500">{c.line_a_route_code} {'->'} {c.line_b_route_code}</span>
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
