import { useCallback, useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
  Marker,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useApp } from "@/contexts/AppContext";
import { useMap as useMapCtx } from "@/contexts/MapContext";

const DEFAULT_CENTER: [number, number] = [-38.9516, -68.0591];
const DEFAULT_ZOOM = 15;
type ThemeMode = "light" | "dark";
type BasemapMode = "calm" | "street";
type TileConfig = {
  url: string;
  attribution: string;
  maxZoom: number;
  opacity?: number;
};

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const CARTO_ATTRIBUTION =
  `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`;

function getTileLayers(theme: ThemeMode, basemap: BasemapMode): TileConfig[] {
  if (theme === "dark") {
    if (basemap === "calm") {
      return [
        {
          attribution: CARTO_ATTRIBUTION,
          url: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
          maxZoom: 20,
        },
        {
          attribution: CARTO_ATTRIBUTION,
          url: "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",
          maxZoom: 20,
          opacity: 0.72,
        },
      ];
    }

    return [
      {
        attribution: CARTO_ATTRIBUTION,
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        maxZoom: 20,
      },
    ];
  }

  if (basemap === "calm") {
    return [
      {
        attribution: CARTO_ATTRIBUTION,
        url: "https://{s}.basemaps.cartocdn.com/voyager_nolabels/{z}/{x}/{y}{r}.png",
        maxZoom: 20,
      },
      {
        attribution: CARTO_ATTRIBUTION,
        url: "https://{s}.basemaps.cartocdn.com/voyager_only_labels/{z}/{x}/{y}{r}.png",
        maxZoom: 20,
        opacity: 0.78,
      },
    ];
  }

  return [
    {
      attribution: OSM_ATTRIBUTION,
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      maxZoom: 19,
    },
  ];
}

function createStopIcon(selected: boolean, heading?: number, isDark = false) {
  const size = selected ? 18 : 14;
  const arrowColor = isDark ? '#93c5fd' : '#1d4ed8';
  if (heading != null) {
    return L.divIcon({
      className: "",
      html: `<div style="width:28px;height:28px;position:relative;display:flex;align-items:center;justify-content:center;">
        <div class="stop-marker${selected ? " selected" : ""}" style="width:${size}px;height:${size}px;"></div>
        <span style="position:absolute;inset:0;display:flex;align-items:flex-start;justify-content:center;transform:rotate(${heading}deg);font-size:9px;color:${arrowColor};line-height:1;padding-top:0px;font-weight:bold;">▲</span>
      </div>`,
      iconSize: [44, 44],
      iconAnchor: [14, 14],
    });
  }
  return L.divIcon({
    className: "",
    html: `<div class="stop-marker${selected ? " selected" : ""}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createBusIcon(routeCode: string, bearing?: number) {
  const rotation = bearing != null ? `transform:rotate(${bearing}deg);` : "";
  const svg = `<svg class="bam-svg" style="${rotation}" viewBox="-5.5 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 22.281v-13.563c0-0.438 0.25-1 0.594-1.344 0.094-0.094 0.219-0.156 0.313-0.219h0.031c1.5-1.156 3.469-2 5.719-2.469 1.188-0.219 2.438-0.344 3.75-0.344s2.563 0.125 3.75 0.344c2.25 0.469 4.219 1.313 5.719 2.469h0.031c0.094 0.063 0.188 0.125 0.281 0.219 0.344 0.344 0.625 0.906 0.625 1.344v13.563c0 1-0.688 1.781-1.594 2v1.813c0 0.844-0.688 1.563-1.531 1.563-0.875 0-1.563-0.719-1.563-1.563v-1.75h-11.438v1.75c0 0.844-0.719 1.563-1.563 1.563-0.875 0-1.563-0.719-1.563-1.563v-1.813c-0.906-0.219-1.563-1-1.563-2z" fill="#1a1a1a"/>
    <path d="M3.125 17.063h14.531c0.563 0 1.031-0.5 1.031-1.063v-5.156c0-0.563-0.469-1.063-1.031-1.063h-14.531c-0.563 0-1 0.5-1 1.063v5.156c0 0.563 0.438 1.063 1 1.063z" fill="#fff"/>
  </svg>`;
  return L.divIcon({
    className: "bus-arrival-marker",
    html: `<div class="flex flex-col items-center justify-center">${svg}<span class="bam-route-code font-black">${routeCode}</span></div>`,
    iconSize: [24, 38],
    iconAnchor: [12, 38],
  });
}

/** Lighten a hex color for dark backgrounds. If luminance is below threshold, boost it. */
function brightenForDark(hex: string): string {
  const raw = hex.replace('#', '')
  const r = parseInt(raw.substring(0, 2), 16)
  const g = parseInt(raw.substring(2, 4), 16)
  const b = parseInt(raw.substring(4, 6), 16)
  // Relative luminance (rough)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  if (lum > 0.45) return hex // already bright enough
  // Boost: blend toward white
  const boost = 0.55
  const nr = Math.round(r + (255 - r) * boost)
  const ng = Math.round(g + (255 - g) * boost)
  const nb = Math.round(b + (255 - b) * boost)
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`
}

const MIN_ZOOM_FOR_STOPS = 13;

function BoundsTracker({
  onBoundsChange,
}: {
  onBoundsChange: (bounds: L.LatLngBounds, zoom: number) => void;
}) {
  const map = useMapEvents({
    moveend() {
      onBoundsChange(map.getBounds(), map.getZoom());
    },
    zoomend() {
      onBoundsChange(map.getBounds(), map.getZoom());
    },
  });
  useEffect(() => {
    onBoundsChange(map.getBounds(), map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function MapEvents() {
  const map = useMap();
  const { setEtaMode } = useMapCtx();

  useEffect(() => {
    const handler = (e: Event) =>
      setEtaMode((e as CustomEvent<boolean>).detail);
    document.addEventListener("micole:setEtamode", handler);
    return () => document.removeEventListener("micole:setEtamode", handler);
  }, [setEtaMode]);

  useEffect(() => {
    const container = map.getContainer();
    const updateCursor = (e: Event) => {
      container.style.cursor = (e as CustomEvent<boolean>).detail
        ? "crosshair"
        : "";
    };
    document.addEventListener("micole:setEtamode", updateCursor);
    return () =>
      document.removeEventListener("micole:setEtamode", updateCursor);
  }, [map]);

  return null;
}

export default function MapView() {
  const [basemap, setBasemap] = useState<"calm" | "street">("calm");
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(DEFAULT_ZOOM);
  const { theme } = useApp();
  const tileLayers = getTileLayers(theme, basemap);

  const handleBoundsChange = useCallback(
    (bounds: L.LatLngBounds, zoom: number) => {
      setMapBounds(bounds);
      setMapZoom(zoom);
    },
    [],
  );
  const {
    selectedStop,
    selectStop,
    stops,
    vehicles,
    routeCoords,
    routeStopIds,
    routeColor,
    routeHeadings,
    etaMode,
    activeDialog,
    connectionOrigin,
    setConnectionOrigin,
    setConnectionDest,
    connectionCreationStep,
    setConnectionCreationStep,
    updateConnectionCreationData,
    shortcutCreationStep,
    setShortcutCreationStep,
    updateShortcutCreationData,
    setActiveDialog,
  } = useMapCtx();

  const isSelectingForConnection = connectionCreationStep !== "idle";
  const isSelectingForShortcut = shortcutCreationStep !== "idle";

  const handleMarkerClick = (stop: (typeof stops)[0]) => {
    if (isSelectingForConnection) {
      if (connectionCreationStep === "selectOrigin") {
        updateConnectionCreationData({ originStop: stop });
        setConnectionCreationStep("selectLineA");
        setActiveDialog("connection");
      } else if (connectionCreationStep === "selectCombination") {
        updateConnectionCreationData({ combinationStop: stop });
        setConnectionCreationStep("selectLineB");
        setActiveDialog("connection");
      } else if (connectionCreationStep === "selectBoardStop") {
        updateConnectionCreationData({ boardStop: stop });
        setConnectionCreationStep("selectDest");
        setActiveDialog("connection");
      } else if (connectionCreationStep === "selectDest") {
        updateConnectionCreationData({ destStop: stop });
        setActiveDialog("connection");
      }
      return;
    }
    if (isSelectingForShortcut) {
      if (shortcutCreationStep === "selectOrigin") {
        updateShortcutCreationData({ originStop: stop });
        setShortcutCreationStep("selectDest");
        setActiveDialog("none");
      } else if (shortcutCreationStep === "selectDest") {
        updateShortcutCreationData({ destStop: stop });
        setShortcutCreationStep("selectLine");
        setActiveDialog("shortcut");
      } else {
        return;
      }
      return;
    }
    if (activeDialog === "connection" && etaMode) {
      if (!connectionOrigin) {
        setConnectionOrigin(stop);
      } else {
        setConnectionDest(stop);
      }
    } else if (!etaMode) {
      selectStop(stop);
    }
  };

  const visibleMarkers = routeStopIds
    ? stops.filter((s) => routeStopIds.has(s.id))
    : mapBounds && mapZoom >= MIN_ZOOM_FOR_STOPS
      ? stops.filter((s) => mapBounds.contains([s.lat, s.lon]))
      : [];

  return (
    <div className="fixed top-[52px] left-0 right-0 bottom-0 z-0">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="absolute inset-0"
      >
        {tileLayers.map((layer) => (
          <TileLayer
            key={`${theme}-${basemap}-${layer.url}`}
            attribution={layer.attribution}
            url={layer.url}
            maxZoom={layer.maxZoom}
            opacity={layer.opacity}
          />
        ))}
        <BoundsTracker onBoundsChange={handleBoundsChange} />
        <MapEvents />
        {visibleMarkers.map((stop) => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lon]}
            icon={createStopIcon(
              selectedStop?.id === stop.id,
              routeHeadings?.get(stop.id),
              theme === 'dark',
            )}
            eventHandlers={{ click: () => handleMarkerClick(stop) }}
          />
        ))}
        {vehicles.map((veh) => (
          <Marker
            key={veh.id}
            position={[veh.lat, veh.lon]}
            icon={createBusIcon(veh.routeCode, veh.bearing)}
            zIndexOffset={100}
          />
        ))}
        {routeCoords && routeCoords.length > 0 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{
              color: theme === "dark"
                ? brightenForDark(routeColor ?? "#1565C0")
                : (routeColor ?? "#1565C0"),
              weight: theme === "dark" ? 6 : 5,
              opacity: theme === "dark" ? 0.96 : 0.85,
            }}
          />
        )}
      </MapContainer>

      <div className="pointer-events-none absolute right-3 top-3 z-[1000] flex gap-2">
        <button
          type="button"
          onClick={() => setBasemap("calm")}
          className={`pointer-events-auto rounded-full border px-3 py-2 text-xs font-semibold shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition-colors ${
            basemap === "calm"
              ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
              : "border-white/70 bg-white/90 text-slate-700 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300"
          }`}
        >
          Calmo
        </button>
        <button
          type="button"
          onClick={() => setBasemap("street")}
          className={`pointer-events-auto rounded-full border px-3 py-2 text-xs font-semibold shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition-colors ${
            basemap === "street"
              ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
              : "border-white/70 bg-white/90 text-slate-700 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300"
          }`}
        >
          Detalle
        </button>
      </div>
    </div>
  );
}
