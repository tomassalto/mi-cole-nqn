import { useState } from "react";
import type { Arrival } from "@/types/api";
import IconButton from "@/components/ui/IconButton";
import DropdownMenu from "@/components/ui/DropdownMenu";

interface ArrivalRowProps {
  arrival: Arrival;
  isLineFavorited: boolean;
  onRowClick: () => void;
  onShowRoute: () => void;
  onToggleFav: () => void;
  onFilterLine: () => void;
  onShowTrip: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  early: "text-rose-600 dark:text-rose-400",
  late: "text-blue-600 dark:text-blue-400",
  ontime: "text-emerald-600 dark:text-emerald-400",
  scheduled: "text-slate-400 dark:text-slate-500",
};

function formatMins(mins: number): { display: string; label: string } {
  if (mins <= 0) return { display: "ahora", label: "" };
  if (mins > 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return { display: m > 0 ? `${h}h ${m}m` : `${h}h`, label: "" };
  }
  return { display: String(mins), label: "min" };
}

function formatHour(ts: number | null): string {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function ArrivalRow({
  arrival,
  isLineFavorited,
  onRowClick,
  onShowRoute,
  onToggleFav,
  onFilterLine,
  onShowTrip,
}: ArrivalRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { display, label } = formatMins(arrival.minutesUntil);
  const hourStr = formatHour(arrival.predictedTs ?? arrival.scheduledTs);
  const color = STATUS_COLORS[arrival.status] ?? "text-slate-500";

  return (
    <div
      role="button"
      tabIndex={0}
      className="group flex w-full cursor-pointer items-center gap-3 border-b border-slate-200/70 px-4 py-3 text-left transition-colors hover:bg-slate-50/90 dark:border-slate-700/70 dark:hover:bg-slate-800/90"
      onClick={onRowClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onRowClick();
        }
      }}
    >
      <IconButton
        icon={<span className="text-lg">{isLineFavorited ? "★" : "☆"}</span>}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFav();
        }}
        label={isLineFavorited ? "Quitar de líneas guardadas" : "Guardar línea"}
        className={isLineFavorited ? "text-amber-400" : "text-slate-500"}
      />
      <span className="w-8 text-[1.7rem] font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-100">
        {arrival.routeCode}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
          {arrival.routeName}
        </div>
        <div
          className={`text-[0.60rem] font-semibold uppercase tracking-[0.16em] ${color}`}
        >
          {arrival.statusLabel}
        </div>
      </div>
      <div className="min-w-[50px] flex-shrink-0 text-right">
        <span
          className={`block text-[1.45rem] font-bold leading-none ${color}`}
        >
          {display}
        </span>
        {label && <span className="text-[0.7rem] text-slate-500 dark:text-slate-400">{label}</span>}
        <span className={`mt-1 block text-[0.82rem] font-semibold ${color}`}>
          {hourStr}
        </span>
      </div>
      <div className="relative">
        <IconButton
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-[18px] w-[18px]"
            >
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          }
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          label="Opciones"
        />
        <DropdownMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          items={[
            {
              label: "Ver recorrido",
              icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M3 5h2V3H3v2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2V3h-2zM5 21v-2H3v2h2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8v-2h-2v2h2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2z" />
                </svg>
              ),
              onClick: onShowRoute,
            },
            {
              label: "Solo esta línea",
              icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
                </svg>
              ),
              onClick: onFilterLine,
            },
            {
              label: "Ver viaje",
              icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
              ),
              onClick: onShowTrip,
            },
          ]}
        />
      </div>
    </div>
  );
}
