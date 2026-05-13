import { useState, useEffect } from 'react'
import { useMap as useMapCtx } from '@/contexts/MapContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useToast } from '@/contexts/ToastContext'
import Modal from '@/components/ui/Modal'
import { calculateConnections } from '@/services/connections'
import type { Connection } from '@/types/api'

export default function ConnectionDialog() {
  const { activeDialog, setActiveDialog, connectionOrigin, connectionDest } = useMapCtx()
  const { lines } = useFavorites()
  const { show } = useToast()
  const [lineAId, setLineAId] = useState<number | null>(null)
  const [lineBId, setLineBId] = useState<number | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(false)

  const open = activeDialog === 'connection'

  useEffect(() => {
    if (!open) { setLineAId(null); setLineBId(null); setConnections([]); setLoading(false) }
  }, [open])

  useEffect(() => {
    if (connectionOrigin && connectionDest && lineAId && lineBId) {
      calculate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionOrigin, connectionDest, lineAId, lineBId])

  const calculate = async () => {
    if (!connectionOrigin || !connectionDest || !lineAId || !lineBId) return
    setLoading(true)
    try {
      const results = await calculateConnections(
        Number(connectionOrigin.id),
        Number(connectionDest.id),
        lineAId,
        lineBId
      )
      setConnections(results)
    } catch {
      show('Error calculando conexiones')
    } finally {
      setLoading(false)
    }
  }

  const lineAName = lines.find(l => Number(l.service_id) === lineAId)?.route_code ?? ''
  const lineBName = lines.find(l => Number(l.service_id) === lineBId)?.route_code ?? ''

  return (
    <Modal open={open} onClose={() => setActiveDialog('none')} title="Conexiones" className="w-[360px] max-h-[85vh] flex flex-col">
      <div className="p-4 flex flex-col gap-3 overflow-y-auto flex-1 min-h-0">
        <div>
          <label className="text-sm font-medium block mb-1.5">Línea que tomás:</label>
          <select value={lineAId ?? ''} onChange={e => { setLineAId(e.target.value ? Number(e.target.value) : null); setConnections([]) }}
            className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm bg-white">
            <option value="">Seleccioná una línea…</option>
            {lines.map(l => <option key={l.id} value={l.service_id}>{l.route_code} — {l.route_name}</option>)}
          </select>
        </div>
        <div className={lineAId ? '' : 'hidden'}>
          <label className="text-sm font-medium block mb-1.5">Línea a combinar:</label>
          <select value={lineBId ?? ''} onChange={e => { setLineBId(e.target.value ? Number(e.target.value) : null); setConnections([]) }}
            className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm bg-white">
            <option value="">Seleccioná una línea…</option>
            {lines.filter(l => Number(l.service_id) !== lineAId).map(l => <option key={l.id} value={l.service_id}>{l.route_code} — {l.route_name}</option>)}
          </select>
        </div>
        {!connectionOrigin && lineAId && (
          <p className="text-xs text-[#6b7280] bg-blue-50 px-3 py-2.5 rounded-lg">
            Tocá la <strong>parada de origen</strong> en el mapa donde tomás la línea {lineAName}.
          </p>
        )}
        {connectionOrigin && !connectionDest && (
          <p className="text-xs text-[#6b7280] bg-blue-50 px-3 py-2.5 rounded-lg">
            Tocá la <strong>parada de combinación</strong> en el mapa donde tomás la línea {lineBName}.
          </p>
        )}
        {connectionOrigin && <p className="text-xs text-[#6b7280]">Origen: <strong>{connectionOrigin.name}</strong></p>}
        {connectionDest && <p className="text-xs text-[#6b7280]">Destino: <strong>{connectionDest.name}</strong></p>}
        {loading && <div className="text-center py-4 text-[#6b7280] text-sm">Calculando…</div>}
        {!loading && connections.length > 0 && (
          <div className="flex flex-col gap-2">
            {connections.slice(0, 5).map((c, i) => (
              <div key={i} className={`p-3 rounded-lg ${c.immediate ? 'bg-green-50 border border-green-200' : 'bg-[#f5f7fa]'}`}>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-[#1565c0]">{lineAName}</span>
                  <span className="text-[#6b7280]">{c.lineATime}</span>
                  <span className="text-[#6b7280]">→</span>
                  <span className="font-bold text-[#1565c0]">{lineBName}</span>
                  <span className="text-[#6b7280]">{c.lineBTime}</span>
                </div>
                <div className="text-xs text-[#6b7280] mt-1">
                  Llegás a las <strong>{c.lineBTime}</strong> · {c.waitMins === 0 ? 'sin espera' : `${c.waitMins} min espera`} · total ~{c.totalMins} min
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && lineAId && lineBId && connectionOrigin && connectionDest && connections.length === 0 && (
          <div className="text-center py-4 text-[#6b7280] text-sm">No hay combinaciones disponibles.</div>
        )}
        <button onClick={() => setActiveDialog('none')} className="py-2 text-[#6b7280] text-sm text-center hover:bg-[#f5f7fa] rounded-lg transition-colors mt-auto">Cancelar</button>
      </div>
    </Modal>
  )
}