import { useState, useEffect } from 'react'
import { useMap as useMapCtx } from '@/contexts/MapContext'
import { useArrivals } from '@/hooks/useArrivals'
import Modal from '@/components/ui/Modal'
import { getEta } from '@/services/eta'
import type { Stop } from '@/types/api'

interface EtaResult {
  type: 'success' | 'error'
  routeCode?: string
  arrivalText?: string
  reachingText?: string
  destName?: string
  errorText?: string
}

export default function EtaDialog() {
  const { etaMode, activeDialog, setActiveDialog, selectedStop } = useMapCtx()
  const [destStop, setDestStop] = useState<Stop | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [result, setResult] = useState<EtaResult | null>(null)
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
      setResult(null)
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
      if (eta.error) {
        setResult({ type: 'error', errorText: eta.error })
        return
      }
      const arrivalText = eta.minutesToFrom <= 0
        ? 'ya está llegando'
        : `llega en ${eta.minutesToFrom} min`
      const reachingText = eta.minutesToDest != null
        ? `Llegás a ${destStop.name} en aprox. ${eta.minutesToFrom + eta.minutesToDest} min.`
        : `El colectivo ${arrivalText} a tu parada.`
      setResult({
        type: 'success',
        routeCode: eta.routeCode,
        arrivalText,
        reachingText,
        destName: destStop.name,
      })
    } catch (err) {
      setResult({ type: 'error', errorText: (err as Error).message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => setActiveDialog('none')}
      title="¿A qué hora llego?"
      className="w-[360px] lg:w-[420px] fullhd:w-[480px]"
    >
      <div className="flex flex-col gap-3 p-4 lg:p-5">
        <div>
          <label className="mb-1.5 block text-sm fullhd:text-base font-medium text-slate-700 dark:text-slate-300">
            Línea que tomás:
          </label>
          <select
            value={selectedServiceId}
            onChange={e => setSelectedServiceId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm fullhd:text-base dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {uniqueArrivals.map(a => (
              <option key={a.serviceId} value={a.serviceId}>
                {a.routeCode} — {a.routeName}
              </option>
            ))}
          </select>
        </div>

        {etaMode ? (
          <p className="rounded-2xl bg-emerald-50 px-3 py-2.5 text-xs fullhd:text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            Tocá la <strong>parada de destino</strong> en el mapa.
          </p>
        ) : loading ? (
          <p className="text-sm fullhd:text-base text-slate-500 dark:text-slate-400">Calculando...</p>
        ) : result ? (
          result.type === 'error' ? (
            <p className="text-sm fullhd:text-base text-red-600 dark:text-red-400">{result.errorText}</p>
          ) : (
            <div className="space-y-1 text-sm fullhd:text-base leading-relaxed text-slate-900 dark:text-slate-200">
              <p>
                El <strong>{result.routeCode}</strong> {result.arrivalText}.
              </p>
              <p>{result.reachingText}</p>
            </div>
          )
        ) : (
          <p className="rounded-2xl bg-emerald-50 px-3 py-2.5 text-xs fullhd:text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            Seleccioná una línea y luego tocá la <strong>parada de destino</strong> en el mapa.
          </p>
        )}

        {destStop && !result && !loading && (
          <p className="text-xs fullhd:text-sm text-slate-500 dark:text-slate-400">
            Destino: <strong>{destStop.name}</strong>
          </p>
        )}

        <button
          onClick={() => setActiveDialog('none')}
          className="py-2 text-sm fullhd:text-base text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Cancelar
        </button>
      </div>
    </Modal>
  )
}
