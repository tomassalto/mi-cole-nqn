import { useState, useEffect } from 'react'
import { useMap as useMapCtx } from '@/contexts/MapContext'
import { useApp } from '@/contexts/AppContext'
import { useToast } from '@/contexts/ToastContext'
import Modal from '@/components/ui/Modal'
import { calculateConnections } from '@/services/connections'
import { saveConnection } from '@/services/savedConnections'
import { getAvailableLines, type StopLine } from '@/services/arrivals'
import type { Connection } from '@/types/api'

export default function ConnectionDialog() {
  const { activeDialog, setActiveDialog, connectionCreationStep, connectionCreationData, setConnectionCreationStep, updateConnectionCreationData, cancelConnectionCreation, startConnectionCreation } = useMapCtx()
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

  useEffect(() => {
    if (!open) {
      cancelConnectionCreation()
      setConnections([])
      setSaveName('')
    }
  }, [open, cancelConnectionCreation])

  useEffect(() => {
    if (connectionCreationStep === 'selectLineA' && connectionCreationData.originStop) {
      getAvailableLines(Number(connectionCreationData.originStop.id))
        .then(lines => {
          if (lines.length === 0) {
            show('No hay líneas en esta parada')
            setConnectionCreationStep('selectOrigin')
          } else {
            setAvailableLinesA(lines)
          }
        })
        .catch(() => {
          show('Error obteniendo líneas')
          setConnectionCreationStep('selectOrigin')
        })
    }
  }, [connectionCreationStep, connectionCreationData.originStop, show, setConnectionCreationStep])

  useEffect(() => {
    if (connectionCreationStep === 'selectLineB' && connectionCreationData.combinationStop) {
      getAvailableLines(Number(connectionCreationData.combinationStop.id))
        .then(lines => {
          if (lines.length === 0) {
            show('No hay líneas en esta parada')
            setConnectionCreationStep('selectCombination')
          } else {
            setAvailableLinesB(lines)
          }
        })
        .catch(() => {
          show('Error obteniendo líneas')
          setConnectionCreationStep('selectCombination')
        })
    }
  }, [connectionCreationStep, connectionCreationData.combinationStop, show, setConnectionCreationStep])

  useEffect(() => {
    if (connectionCreationStep === 'selectDest' && connectionCreationData.combinationStop && connectionCreationData.lineBServiceId) {
      setLoadingConnections(true)
      calculateConnections(
        Number(connectionCreationData.combinationStop.id),
        Number(connectionCreationData.destStop!.id),
        connectionCreationData.lineBServiceId,
        connectionCreationData.lineBServiceId
      ).then(results => {
        setConnections(results.slice(0, 5))
      }).catch(() => {
        show('Error calculando conexiones')
      }).finally(() => setLoadingConnections(false))
    }
  }, [connectionCreationStep, connectionCreationData.combinationStop, connectionCreationData.destStop, connectionCreationData.lineBServiceId])

  const handleSaveConnection = async () => {
    if (!saveName.trim() || !connectionCreationData.originStop || !connectionCreationData.combinationStop || !connectionCreationData.lineAServiceId || !connectionCreationData.lineBServiceId) return
    setSaving(true)
    try {
      await saveConnection(
        saveName.trim(),
        Number(connectionCreationData.originStop.id),
        connectionCreationData.originStop.name,
        Number(connectionCreationData.combinationStop.id),
        connectionCreationData.combinationStop.name,
        connectionCreationData.lineAServiceId,
        connectionCreationData.lineARouteCode,
        connectionCreationData.lineBServiceId,
        connectionCreationData.lineBRouteCode
      )
      await refreshSavedConnections()
      show('Conexión guardada')
      cancelConnectionCreation()
      setSaveName('')
    } catch {
      show('Error guardando conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleLoadConnection = (conn: typeof savedConnections[0]) => {
    const origin = { id: conn.origin_stop_id, name: conn.origin_stop_name ?? '', lat: 0, lon: 0 }
    const dest = { id: conn.dest_stop_id, name: conn.dest_stop_name ?? '', lat: 0, lon: 0 }
    updateConnectionCreationData({
      originStop: origin,
      lineAServiceId: conn.line_a_service_id,
      lineARouteCode: conn.line_a_route_code ?? '',
      combinationStop: dest,
      lineBServiceId: conn.line_b_service_id,
      lineBRouteCode: conn.line_b_route_code ?? '',
    })
    setConnectionCreationStep('fillName')
  }

  const renderStep = () => {
    if (connectionCreationStep === 'selectOrigin') {
      return (
        <div className="text-center py-4">
          <p className="text-sm text-[#6b7280] mb-4">Tocá la <strong>parada inicial</strong> donde te subís al primer colectivo</p>
          <button onClick={() => setConnectionCreationStep('idle')} className="text-[#6b7280] text-sm underline">Cancelar</button>
        </div>
      )
    }

    if (connectionCreationStep === 'selectLineA') {
      return (
        <div>
          <p className="text-sm text-[#6b7280] mb-3">Parada: <strong>{connectionCreationData.originStop?.name}</strong></p>
          <p className="text-sm font-medium mb-2">¿Qué línea tomás aquí?</p>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {availableLinesA.map(line => (
              <button key={line.serviceId}
                onClick={() => {
                  updateConnectionCreationData({ lineAServiceId: line.serviceId, lineARouteCode: line.routeCode })
                  setConnectionCreationStep('selectCombination')
                }}
                className="p-3 text-left border border-[#e5e7eb] rounded-lg hover:bg-[#f5f7fa] transition-colors"
              >
                <span className="font-bold text-[#1565c0]">{line.routeCode}</span>
                <span className="text-xs text-[#6b7280] ml-2">{line.routeName}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setConnectionCreationStep('selectOrigin')} className="mt-3 text-[#6b7280] text-sm underline">Volver</button>
        </div>
      )
    }

    if (connectionCreationStep === 'selectCombination') {
      return (
        <div className="text-center py-4">
          <p className="text-sm text-[#6b7280] mb-4">Tocá la <strong>parada de combinación</strong> donde te bajás y te subís a la segunda línea</p>
          <button onClick={() => setConnectionCreationStep('selectLineA')} className="text-[#6b7280] text-sm underline">Volver</button>
        </div>
      )
    }

    if (connectionCreationStep === 'selectLineB') {
      return (
        <div>
          <p className="text-sm text-[#6b7280] mb-3">Parada: <strong>{connectionCreationData.combinationStop?.name}</strong></p>
          <p className="text-sm font-medium mb-2">¿Qué línea tomás aquí?</p>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {availableLinesB.map(line => (
              <button key={line.serviceId}
                onClick={() => {
                  updateConnectionCreationData({ lineBServiceId: line.serviceId, lineBRouteCode: line.routeCode })
                  setConnectionCreationStep('selectDest')
                }}
                className="p-3 text-left border border-[#e5e7eb] rounded-lg hover:bg-[#f5f7fa] transition-colors"
              >
                <span className="font-bold text-[#1565c0]">{line.routeCode}</span>
                <span className="text-xs text-[#6b7280] ml-2">{line.routeName}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setConnectionCreationStep('selectCombination')} className="mt-3 text-[#6b7280] text-sm underline">Volver</button>
        </div>
      )
    }

    if (connectionCreationStep === 'selectDest') {
      return (
        <div className="text-center py-4">
          <p className="text-sm text-[#6b7280] mb-4">Tocá la <strong>parada destino final</strong> (opcional) para ver a qué hora llegás</p>
          {connectionCreationData.destStop ? (
            <div className="mb-4 p-3 bg-[#f5f7fa] rounded-lg">
              <p className="text-sm">Destino: <strong>{connectionCreationData.destStop.name}</strong></p>
              {loadingConnections && <p className="text-xs text-[#6b7280] mt-2">Calculando...</p>}
              {!loadingConnections && connections.length > 0 && (
                <p className="text-sm mt-2 text-[#1565c0]">Llegás a las <strong>{connections[0].lineBTime}</strong></p>
              )}
            </div>
          ) : null}
          <div className="flex gap-2 justify-center">
            <button onClick={() => setConnectionCreationStep('fillName')} className="px-4 py-2 bg-[#f5f7fa] border border-[#e5e7eb] rounded-lg text-sm">
              {connectionCreationData.destStop ? 'Continuar' : 'Omitir destino'}
            </button>
            <button onClick={() => setConnectionCreationStep('selectLineB')} className="text-[#6b7280] text-sm underline">Volver</button>
          </div>
        </div>
      )
    }

    if (connectionCreationStep === 'fillName') {
      const canSave = saveName.trim() && connectionCreationData.originStop && connectionCreationData.combinationStop && connectionCreationData.lineAServiceId && connectionCreationData.lineBServiceId
      return (
        <div>
          <div className="mb-4 p-3 bg-[#f5f7fa] rounded-lg text-left">
            <p className="text-xs text-[#6b7280] mb-2">Resumen:</p>
            <p className="text-sm"><strong>{connectionCreationData.originStop?.name}</strong> → <strong>{connectionCreationData.lineARouteCode}</strong></p>
            <p className="text-sm"><strong>{connectionCreationData.combinationStop?.name}</strong> → <strong>{connectionCreationData.lineBRouteCode}</strong></p>
            {connectionCreationData.destStop && <p className="text-sm text-[#1565c0]">Destino: {connectionCreationData.destStop.name}</p>}
          </div>
          <input
            type="text"
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            placeholder="Nombre (ej: Casa → Trabajo)"
            className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm mb-3"
            onKeyDown={e => e.key === 'Enter' && canSave && !saving && handleSaveConnection()}
          />
          <div className="flex gap-2">
            <button onClick={handleSaveConnection} disabled={!canSave || saving}
              className="flex-1 px-4 py-2 bg-[#1565c0] text-white rounded-lg text-sm disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar conexión'}
            </button>
            <button onClick={() => setConnectionCreationStep('selectDest')} className="px-4 py-2 text-[#6b7280] text-sm">Volver</button>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <Modal open={open} onClose={() => setActiveDialog('none')} title={isCreating ? 'Nueva conexión' : 'Conexiones'} className="w-[360px] max-h-[85vh] flex flex-col">
      <div className="p-4 flex flex-col gap-3 overflow-y-auto flex-1 min-h-0">
        {isCreating ? (
          renderStep()
        ) : (
          <>
            <button onClick={startConnectionCreation} className="w-full px-4 py-3 bg-[#1565c0] text-white rounded-lg text-sm font-medium hover:bg-[#0d47a1] transition-colors">
              + Nueva conexión
            </button>
            {savedConnections.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[#6b7280] mb-2">Conexiones guardadas:</p>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {savedConnections.map(c => (
                    <button key={c.id} onClick={() => handleLoadConnection(c)}
                      className="text-left px-3 py-2 text-sm rounded hover:bg-[#f5f7fa] border border-[#e5e7eb]">
                      <span className="font-medium text-[#1565c0]">{c.name}</span>
                      <span className="text-xs text-[#6b7280] block">{c.line_a_route_code} → {c.line_b_route_code}</span>
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