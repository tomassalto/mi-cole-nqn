import { useApp } from "@/contexts/AppContext";
import { useMap as useMapCtx } from "@/contexts/MapContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import DashboardConnectionCard from "./DashboardConnectionCard";
import DashboardShortcutCard from "./DashboardShortcutCard";

export default function DashboardView() {
  const { savedConnections, savedShortcuts } = useApp();
  const { closeDrawer } = useApp();
  const {
    startConnectionCreation,
    startShortcutCreation,
    setConnectionCreationStep,
    setActiveDialog,
    updateConnectionCreationData,
  } = useMapCtx();

  const { connections, shortcuts, loading, refreshing, refresh } =
    useDashboardData(savedConnections, savedShortcuts);

  const handleOpenConnection = (conn: (typeof savedConnections)[0]) => {
    updateConnectionCreationData({
      originStop: {
        id: conn.origin_stop_id,
        name: conn.origin_stop_name ?? "",
        lat: 0,
        lon: 0,
      },
      combinationStop: {
        id: conn.transfer_stop_a_id ?? conn.origin_stop_id,
        name: conn.transfer_stop_a_name ?? "",
        lat: 0,
        lon: 0,
      },
      boardStop: {
        id: conn.board_stop_id ?? conn.dest_stop_id,
        name: conn.board_stop_name ?? "",
        lat: 0,
        lon: 0,
      },
      destStop: {
        id: conn.dest_stop_id,
        name: conn.dest_stop_name ?? "",
        lat: 0,
        lon: 0,
      },
      lineAServiceId: conn.line_a_service_id,
      lineARouteCode: conn.line_a_route_code ?? "",
      lineBServiceId: conn.line_b_service_id,
      lineBRouteCode: conn.line_b_route_code ?? "",
    });
    setConnectionCreationStep("viewSaved");
    setActiveDialog("connection");
    closeDrawer();
  };

  const handleOpenShortcut = (_shortcut: (typeof savedShortcuts)[0]) => {
    // Card click: future could open arrivals panel at origin stop filtered by line
  };

  const hasAnyData = connections.length > 0 || shortcuts.length > 0;

  // ── Empty state ───────────────────────────────────────────────────
  if (!hasAnyData && !loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-4 text-4xl">🏠</div>
        <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
          Todo listo para arrancar
        </h3>
        <p className="mb-6 text-xs text-slate-500 dark:text-slate-400">
          Guardá conexiones o atajos y aparecerán acá con sus horarios en vivo.
        </p>
        <div className="flex flex-col gap-2 w-full max-w-[220px]">
          <button
            onClick={() => {
              closeDrawer();
              startShortcutCreation();
            }}
            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
          >
            + Crear atajo
          </button>
          <button
            onClick={() => {
              closeDrawer();
              startConnectionCreation();
            }}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            + Nueva conexión
          </button>
        </div>
      </div>
    );
  }

  const hasConnections = connections.length > 0;
  const hasShortcuts = shortcuts.length > 0;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 lg:px-5 lg:py-4 lg:space-y-5">
      {/* Refresh button */}
      <div className="flex items-center justify-end">
        <button
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-700/80"
        >
          <svg
            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 2v6h-6M3 22v-6h6" />
            <path d="M21 8a9 9 0 0 0-16.41-3.59M3 16a9 9 0 0 0 16.41 3.59" />
          </svg>
          {refreshing ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      {/* Loading state for initial load */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700/50 dark:bg-slate-800/50"
            >
              <div className="mb-3 h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-700/50" />
                <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-slate-700/50" />
                <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-700/50" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Connections section ─────────────────────────────────------- */}
      {hasConnections && (
        <section>
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 lg:mb-3 lg:text-sm">
            Conexiones
          </h3>
          <div className="space-y-2">
            {connections.map((c) => (
              <DashboardConnectionCard
                key={c.conn.id}
                conn={c.conn}
                results={c.results}
                loading={c.loading}
                onClick={() => handleOpenConnection(c.conn)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Shortcuts section ────────────────────────────────────────── */}
      {hasShortcuts && (
        <section>
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 lg:mb-3 lg:text-sm">
            Atajos
          </h3>
          <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {shortcuts.map((s) => (
              <DashboardShortcutCard
                key={s.shortcut.id}
                shortcut={s.shortcut}
                trips={s.trips}
                loading={s.loading}
                onClick={() => handleOpenShortcut(s.shortcut)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
