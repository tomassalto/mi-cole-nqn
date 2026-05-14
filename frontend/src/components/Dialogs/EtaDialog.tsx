import { useState, useEffect } from 'react'
import { useMap as useMapCtx } from '@/contexts/MapContext'
import { useArrivals } from '@/hooks/useArrivals'
import Modal from '@/components/ui/Modal'
import { getEta } from '@/services/eta'
import type { Stop } from '@/types/api'

export default function EtaDialog() {
  const { etaMode, activeDialog, setActiveDialog, selectedStop } = useMapCtx()
  const [destStop, setDestStop] = useState<Stop | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const stopId = selectedStop ? Number(selectedStop.id) : null
  const { arrivals } = useArrivals(stopId)

  const open = activeDialog === 'eta'
  const uniqueArrivals = arrivals.filter((a, i, arr) => arr.findIndex(x => x.serviceId === a.serviceId) === i)

  useEffect(() => {
    if (open && uniqueArrivals.length > 0 && !selectedServiceId) {
      setSelectedServiceId(uniqueArrivals[0].serviceId)
    }
  }, [open, uniqueArrivals, selectedServiceId])

  useEffect(() => {
    if (!open) {
      setDestStop(null)
      setResult('')
      setSelectedServiceId('')
      setLoading(false)
    }
  }, [open])

  useEffect(() => {
    if (destStop && selectedServiceId && stopId) {
      calculateEta()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destStop])

  const calculateEta = async () => {
    if (!stopId || !destStop || !selectedServiceId) return
    setLoading(true)
    try {
      const eta = await getEta(stopId, Number(destStop.id), Number(selectedServiceId))
      if (eta.error) { setResult(`<p class="text-red-600">${eta.error}</p>`); return }
      const arrival = eta.minutesToFrom <= 0 ? '<strong>ya está llegando</strong>' : `llega en <strong>${eta.minutesToFrom} min</strong>`
      const reaching = eta.minutesToDest != null
        ? `Llegás a <strong>${destStop.name}</strong> en aprox. <strong>${eta.minutesToFrom + eta.minutesToDest} min</strong>.`
        : `El colectivo ${arrival} a tu parada.`
      setResult(`<p>El <strong>${eta.routeCode}</strong> ${arrival}.</p><p>${reaching}</p>`)
    } catch (err) {
      setResult(`<p class="text-red-600">${(err as Error).message}</p>`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={() => setActiveDialog('none')} title="¿A qué hora llego?" className="w-[360px]">
      <div className="flex flex-col gap-3 p-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Línea que tomás:</label>
          <select
            value={selectedServiceId}
            onChange={e => setSelectedServiceId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {uniqueArrivals.map(a => <option key={a.serviceId} value={a.serviceId}>{a.routeCode} — {a.routeName}</option>)}
          </select>
        </div>
        {etaMode ? (
          <p className="rounded-2xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">Tocá la <strong>parada de destino</strong> en el mapa.</p>
        ) : loading ? (
          <p className="text-sm text-slate-500">Calculando...</p>
        ) : result ? (
          <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: result }} />
        ) : (
          <p className="rounded-2xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
            Seleccioná una línea y luego tocá la <strong>parada de destino</strong> en el mapa.
          </p>
        )}
        {destStop && !result && !loading && <p className="text-xs text-slate-500">Destino: <strong>{destStop.name}</strong></p>}
        <button onClick={() => setActiveDialog('none')} className="py-2 text-sm text-slate-500">Cancelar</button>
      </div>
    </Modal>
  )
}
