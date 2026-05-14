import type { Arrival } from "@/types/api";
import IconButton from "@/components/ui/IconButton";

interface ArrivalRowProps {
  arrival: Arrival;
  isLineFavorited: boolean;
  onRowClick: () => void;
  onShowRoute: () => void;
  onToggleFav: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  early: "text-rose-600",
  late: "text-blue-600",
  ontime: "text-emerald-600",
  scheduled: "text-slate-400",
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
}: ArrivalRowProps) {
  const { display, label } = formatMins(arrival.minutesUntil);
  const hourStr = formatHour(arrival.predictedTs ?? arrival.scheduledTs);
  const color = STATUS_COLORS[arrival.status] ?? "text-slate-500";

  return (
    <div
      role="button"
      tabIndex={0}
      className="group flex w-full cursor-pointer items-center gap-3 border-b border-slate-200/70 px-4 py-3 text-left transition-colors hover:bg-slate-50/90"
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
      <span className="w-8 text-[1.7rem] font-semibold leading-none tracking-tight text-slate-900">
        {arrival.routeCode}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-slate-900">
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
        {label && <span className="text-[0.7rem] text-slate-500">{label}</span>}
        <span className={`mt-1 block text-[0.82rem] font-semibold ${color}`}>
          {hourStr}
        </span>
      </div>
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
          onShowRoute();
        }}
        label="Ver recorrido"
      />
    </div>
  );
}
