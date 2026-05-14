import { useEffect, useMemo, useState } from "react";
import { useMap as useMapCtx } from "@/contexts/MapContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useApp } from "@/contexts/AppContext";
import { useToast as useToastCtx } from "@/contexts/ToastContext";
import { useArrivals } from "@/hooks/useArrivals";
import { useSchedule } from "@/hooks/useSchedule";
import IconButton from "@/components/ui/IconButton";
import ArrivalRow from "./ArrivalRow";
import ScheduleView from "./ScheduleView";

export default function ArrivalsPanel() {
  const {
    selectedStop,
    selectStop,
    showRoute,
    clearRoute,
    routeStopIds,
    setActiveDialog,
    updateVehicles,
  } = useMapCtx();
  const { openConsultation } = useApp();
  const {
    isLineFavorited,
    addLine,
    removeLine,
    addStop,
    removeStop,
    isStopFavorited,
  } = useFavorites();
  const { show } = useToastCtx();
  const [view, setView] = useState<"arrivals" | "schedule">("arrivals");
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const stopId = selectedStop ? Number(selectedStop.id) : null;
  const { arrivals, raw, loading, error } = useArrivals(stopId);
  const { stops: scheduleStops } = useSchedule(
    selectedTripId,
    selectedStop ? Number(selectedStop.id) : null,
  );
  const arrivalLookup = useMemo(() => {
    const map = new Map<string, { routeCode: string; routeName: string }>();
    for (const arrival of arrivals) {
      if (!arrival.vehicleId) continue;
      if (!map.has(arrival.vehicleId)) {
        map.set(arrival.vehicleId, {
          routeCode: arrival.routeCode,
          routeName: arrival.routeName,
        });
      }
    }
    return map;
  }, [arrivals]);

  useEffect(() => {
    let cancelled = false;
    type VehicleRef = { id: string; lat: number; lon: number; bearing?: number }
    const vehicleRefs = (Object.entries(raw?.references?.vehicles ?? {})
      .map(([key, v]) => {
        if (v == null) return null
        const id = v.id ?? Number(key);
        const lat = Number(v.lat);
        const lon = Number(v.lon);
        if (!Number.isFinite(id) || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        return {
          id: String(id),
          lat,
          lon,
          bearing: v.bearing != null ? Number(v.bearing) : undefined,
        } satisfies VehicleRef;
      })
      .filter(Boolean)) as VehicleRef[];
    const ids = vehicleRefs.map((v) => v.id);

    if (!selectedStop || ids.length === 0) {
      updateVehicles([]);
      return () => {
        cancelled = true;
      };
    }

    const baseVehicles = new Map(
      vehicleRefs.map((v) => [
        v.id,
        {
          id: v.id,
          lat: v.lat,
          lon: v.lon,
          routeCode: arrivalLookup.get(v.id)?.routeCode ?? "",
          serviceId: "",
          minutesUntil: 0,
          arriving: false,
          time: "",
          bearing: v.bearing,
        },
      ]),
    );

    const syncSnapshot = () => {
      if (cancelled) return;
      updateVehicles([...baseVehicles.values()]);
    };

    syncSnapshot();

    const wsUrl =
      window.location.port === "5173"
        ? `ws://localhost:3001/ws/vehicles?ids=${encodeURIComponent(ids.join(","))}`
        : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/vehicles?ids=${encodeURIComponent(ids.join(","))}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as {
          type?: string;
          id?: string;
          lat?: number;
          lon?: number;
        };
        if (
          data.type !== "location" ||
          !data.id ||
          data.lat == null ||
          data.lon == null
        )
          return;
        const current = baseVehicles.get(String(data.id));
        if (!current) return;
        baseVehicles.set(String(data.id), {
          ...current,
          lat: data.lat,
          lon: data.lon,
        });
        syncSnapshot();
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => {
      if (!cancelled) updateVehicles([...baseVehicles.values()]);
    };

    return () => {
      cancelled = true;
      ws.close();
      updateVehicles([]);
    };
  }, [arrivalLookup, raw, selectedStop, updateVehicles]);

  if (!selectedStop) return null;

  const handleRowClick = async (arrival: (typeof arrivals)[0]) => {
    await showRoute(Number(arrival.serviceId));
    if (arrival.tripId) {
      setSelectedTripId(arrival.tripId);
      setView("schedule");
    }
  };

  const handleToggleStopFav = async () => {
    if (isStopFavorited(Number(selectedStop.id))) {
      await removeStop(Number(selectedStop.id));
      show("Parada eliminada");
    } else {
      await addStop(selectedStop);
      show("Parada guardada");
    }
  };

  const handleToggleLineFav = async (
    serviceId: number,
    routeCode: string,
    routeName: string,
    add: boolean,
  ) => {
    if (add) {
      await addLine(serviceId, routeCode, routeName);
      show(`Línea ${routeCode} guardada`);
    } else {
      await removeLine(serviceId);
      show(`Línea ${routeCode} eliminada`);
    }
  };

  const handleClearFilter = () => clearRoute();
  const handleClose = () => selectStop(null);
  const handleBack = () => {
    setView("arrivals");
    setSelectedTripId(null);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 flex max-h-[82vh] flex-col overflow-hidden rounded-t-[28px] border border-white/70 bg-white/90 shadow-[0_-24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/92 dark:shadow-[0_-24px_60px_rgba(0,0,0,0.40)] md:bottom-4 md:left-4 md:right-auto md:top-[72px] md:w-[380px] md:rounded-[28px] md:shadow-[0_24px_60px_rgba(15,23,42,0.14)] md:dark:shadow-[0_24px_60px_rgba(0,0,0,0.40)] lg:w-[480px]">
      <div className="mx-auto my-2 h-1.5 w-14 rounded-full bg-slate-200 dark:bg-slate-700 md:hidden" />
      <div className="flex items-start justify-between border-b border-slate-200/80 px-4 pb-3 pt-4 dark:border-slate-700/80">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
            {selectedStop.name}
          </h2>
          {selectedStop.code && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Parada {selectedStop.code}
            </span>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          {routeStopIds && (
            <IconButton
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M3 5h2V3H3v2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2V3h-2zM5 21v-2H3v2h2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8v-2h-2v2h2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2z" />
                </svg>
              }
              onClick={handleClearFilter}
              label="Ver todas las paradas"
            />
          )}
          <IconButton
            icon={
              <span className="text-lg">
                {isStopFavorited(Number(selectedStop.id)) ? "★" : "☆"}
              </span>
            }
            onClick={handleToggleStopFav}
            label={
              isStopFavorited(Number(selectedStop.id))
                ? "Quitar de favoritos"
                : "Guardar parada"
            }
            className={
              isStopFavorited(Number(selectedStop.id)) ? "text-amber-400" : ""
            }
          />
          <IconButton
            icon={<span>✕</span>}
            onClick={handleClose}
            label="Cerrar panel"
          />
        </div>
      </div>
      {view === "arrivals" ? (
        <>
          <div className="flex-1 overflow-y-auto py-2">
            {loading && (
              <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Cargando llegadas...
              </p>
            )}
            {error && (
              <p className="px-4 py-6 text-center text-sm text-red-600 dark:text-red-400">
                Error: {error}
              </p>
            )}
            {!loading && !error && arrivals.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No hay llegadas próximas.
              </p>
            )}
            {!loading &&
              !error &&
              arrivals.map((arrival) => {
                const serviceId = Number(arrival.serviceId);
                const fav = isLineFavorited(serviceId);
                return (
                  <ArrivalRow
                    key={`${arrival.serviceId}-${arrival.tripId ?? arrival.scheduledTs}`}
                    arrival={arrival}
                    isLineFavorited={fav}
                    onRowClick={() => handleRowClick(arrival)}
                    onShowRoute={() => showRoute(serviceId)}
                    onToggleFav={() =>
                      handleToggleLineFav(
                        serviceId,
                        arrival.routeCode,
                        arrival.routeName,
                        !fav,
                      )
                    }
                  />
                );
              })}
          </div>
          <div className="border-t border-slate-200/80 p-4 dark:border-slate-700/80">
            <button
              onClick={() => setActiveDialog("eta")}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              ¿A qué hora llego a otra parada?
            </button>
            <button
              onClick={openConsultation}
              className="mt-2 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-700/50 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
            >
              Ver próximos viajes guardados
            </button>
          </div>
        </>
      ) : (
        <ScheduleView
          stops={scheduleStops}
          title={
            arrivals.find((a) => a.tripId === selectedTripId)
              ? `${arrivals.find((a) => a.tripId === selectedTripId)?.routeCode} · ${arrivals.find((a) => a.tripId === selectedTripId)?.routeName}`
              : "Horario"
          }
          onBack={handleBack}
        />
      )}
    </div>
  );
}
