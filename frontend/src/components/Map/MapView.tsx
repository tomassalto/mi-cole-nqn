import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, {
  Marker,
  Source,
  Layer,
  NavigationControl,
  AttributionControl,
  GeolocateControl,
} from "react-map-gl/maplibre";
import type { MapRef, MapLayerMouseEvent } from "react-map-gl/maplibre";
import type { StyleSpecification, GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useApp } from "@/contexts/AppContext";
import { useMap as useMapCtx } from "@/contexts/MapContext";

const DEFAULT_CENTER: [number, number] = [-38.9516, -68.0591];
const DEFAULT_ZOOM = 15;

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StyleSpec = StyleSpecification & { layers?: any[] };

/** Patch a MapTiler dark style with custom colors. */
function patchDarkStyle(style: StyleSpec): StyleSpec {
  if (!style.layers) return style;

  const patched = {
    ...style,
    layers: style.layers.map((layer) => {
      const id = (layer.id as string) ?? "";
      const type = layer.type as string;
      const paint = (layer.paint ?? {}) as Record<string, unknown>;

      // Roads → #AAAAAA, casings slightly darker
      if (type === "line" && /road|street|highway|trunk|motor|path|bridge|tunnel|link|track/i.test(id)) {
        const newPaint = { ...paint };
        if (id.includes("casing") || id.includes("outline")) {
          newPaint["line-color"] = "#777777";
        } else {
          newPaint["line-color"] = "#AAAAAA";
        }
        return { ...layer, paint: newPaint };
      }

      // Green spaces (parks, grass, forest) → #2E361B
      if (type === "fill" && /park|grass|green|forest|wood|garden|cemetery|recreation|leisure|nature/i.test(id)) {
        return { ...layer, paint: { ...paint, "fill-color": "#2E361B" } };
      }

      // Buildings → #211F17
      if (type === "fill" && /building/i.test(id)) {
        return { ...layer, paint: { ...paint, "fill-color": "#211F17" } };
      }

      // Land / residential / background fills → #37342F
      if (type === "fill" && /land|resident|urban|neighbourhood|industrial|commercial|retail|farmland/i.test(id)) {
        return { ...layer, paint: { ...paint, "fill-color": "#37342F" } };
      }

      // Background color
      if (type === "background") {
        return { ...layer, paint: { ...paint, "background-color": "#37342F" } };
      }

      // Road labels → light gray with dark halo
      if (type === "symbol" && /road|street/i.test(id)) {
        return {
          ...layer,
          paint: {
            ...paint,
            "text-color": "#cccccc",
            "text-halo-color": "#2a2820",
          },
        };
      }

      return layer;
    }),
  };

  return patched;
}

function getMapStyleUrl(
  theme: "light" | "dark",
  basemap: "calm" | "street",
): string {
  if (theme === "dark" && MAPTILER_KEY) {
    return `https://api.maptiler.com/maps/base-v4-dark/style.json?key=${MAPTILER_KEY}`;
  }
  if (theme === "dark") {
    return "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
  }
  // Light mode: MapTiler if key available, otherwise CARTO
  if (MAPTILER_KEY) {
    return basemap === "calm"
      ? `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_KEY}`
      : `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;
  }
  return basemap === "calm"
    ? "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    : "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
}

/** Fetch + patch dark styles; light styles pass through as URL string. */
function useMapStyle(theme: "light" | "dark", basemap: "calm" | "street") {
  const [style, setStyle] = useState<string | StyleSpec>(
    getMapStyleUrl(theme, basemap),
  );

  useEffect(() => {
    const url = getMapStyleUrl(theme, basemap);

    if (theme !== "dark" || !MAPTILER_KEY) {
      setStyle(url);
      return;
    }

    // Dark + MapTiler → fetch and patch
    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((json: StyleSpec) => {
        if (!cancelled) setStyle(patchDarkStyle(json));
      })
      .catch(() => {
        if (!cancelled) setStyle(url);
      });
    return () => { cancelled = true; };
  }, [theme, basemap]);

  return style;
}

/** Lighten a hex color for dark backgrounds. */
function brightenForDark(hex: string): string {
  const raw = hex.replace("#", "");
  const r = parseInt(raw.substring(0, 2), 16);
  const g = parseInt(raw.substring(2, 4), 16);
  const b = parseInt(raw.substring(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum > 0.35) return hex;
  const boost = 0.7;
  const nr = Math.round(r + (255 - r) * boost);
  const ng = Math.round(g + (255 - g) * boost);
  const nb = Math.round(b + (255 - b) * boost);
  return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

const MIN_ZOOM_FOR_STOPS = 15;
const MIN_ZOOM_FOR_VEHICLES = 13;

/* ── Marker components ──────────────────────────────────────────────────── */

function StopMarkerContent({
  selected,
  heading,
  isDark,
}: {
  selected: boolean;
  heading?: number;
  isDark: boolean;
}) {
  const size = selected ? 18 : 14;
  const arrowColor = isDark ? "#93c5fd" : "#1d4ed8";

  if (heading != null) {
    return (
      <div
        style={{
          width: 28,
          height: 28,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className={`stop-marker${selected ? " selected" : ""}`}
          style={{ width: size, height: size }}
        />
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            transform: `rotate(${heading}deg)`,
            fontSize: 9,
            color: arrowColor,
            lineHeight: 1,
            fontWeight: "bold",
          }}
        >
          ▲
        </span>
      </div>
    );
  }

  return (
    <div
      className={`stop-marker${selected ? " selected" : ""}`}
      style={{ width: size, height: size }}
    />
  );
}

function BusMarkerContent({
  routeCode,
  bearing,
}: {
  routeCode: string;
  bearing?: number;
}) {
  return (
    <div className="bus-arrival-marker" style={{ width: 28, minHeight: 40 }}>
      <svg
        className="bam-svg"
        style={bearing != null ? { transform: `rotate(${bearing}deg)` } : undefined}
        viewBox="-5.5 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 22.281v-13.563c0-0.438 0.25-1 0.594-1.344 0.094-0.094 0.219-0.156 0.313-0.219h0.031c1.5-1.156 3.469-2 5.719-2.469 1.188-0.219 2.438-0.344 3.75-0.344s2.563 0.125 3.75 0.344c2.25 0.469 4.219 1.313 5.719 2.469h0.031c0.094 0.063 0.188 0.125 0.281 0.219 0.344 0.344 0.625 0.906 0.625 1.344v13.563c0 1-0.688 1.781-1.594 2v1.813c0 0.844-0.688 1.563-1.531 1.563-0.875 0-1.563-0.719-1.563-1.563v-1.75h-11.438v1.75c0 0.844-0.719 1.563-1.563 1.563-0.875 0-1.563-0.719-1.563-1.563v-1.813c-0.906-0.219-1.563-1-1.563-2z"
          fill="#1a1a1a"
        />
        <path
          d="M3.125 17.063h14.531c0.563 0 1.031-0.5 1.031-1.063v-5.156c0-0.563-0.469-1.063-1.031-1.063h-14.531c-0.563 0-1 0.5-1 1.063v5.156c0 0.563 0.438 1.063 1 1.063z"
          fill="#fff"
        />
      </svg>
      <span className="bam-route-code font-black">{routeCode || "•"}</span>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */

export default function MapView() {
  const [basemap, setBasemap] = useState<"calm" | "street">("calm");
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [mapBounds, setMapBounds] = useState<{
    west: number;
    south: number;
    east: number;
    north: number;
  } | null>(null);
  const mapRef = useRef<MapRef>(null);
  const { theme } = useApp();
  const mapStyle = useMapStyle(theme, basemap);

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
    setEtaMode,
  } = useMapCtx();

  const isSelectingForConnection = connectionCreationStep !== "idle";
  const isSelectingForShortcut = shortcutCreationStep !== "idle";

  // ETA mode: listen for custom event
  useEffect(() => {
    const handler = (e: Event) =>
      setEtaMode((e as CustomEvent<boolean>).detail);
    document.addEventListener("micole:setEtamode", handler);
    return () => document.removeEventListener("micole:setEtamode", handler);
  }, [setEtaMode]);

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
      // Center map on selected stop
      mapRef.current?.flyTo({
        center: [stop.lon, stop.lat],
        zoom: Math.max(mapZoom, 15),
        duration: 800,
      });
    }
  };

  const syncBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    setMapBounds({
      west: b.getWest(),
      south: b.getSouth(),
      east: b.getEast(),
      north: b.getNorth(),
    });
    setMapZoom(map.getZoom());
  }, []);

  const visibleMarkers = useMemo(() => {
    if (routeStopIds) return stops.filter((s) => routeStopIds.has(s.id));
    if (!mapBounds || mapZoom < MIN_ZOOM_FOR_STOPS) return [];
    return stops.filter(
      (s) =>
        s.lat >= mapBounds.south &&
        s.lat <= mapBounds.north &&
        s.lon >= mapBounds.west &&
        s.lon <= mapBounds.east,
    );
  }, [stops, routeStopIds, mapBounds, mapZoom]);

  const visibleVehicles =
    routeCoords.length > 0 || mapZoom >= MIN_ZOOM_FOR_VEHICLES ? vehicles : [];

  // Clustered stops: all stops as a single GeoJSON source
  const stopsGeoJSON = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: stops.map((s) => ({
        type: "Feature" as const,
        properties: { id: s.id, name: s.name, code: s.code },
        geometry: { type: "Point" as const, coordinates: [s.lon, s.lat] as [number, number] },
      })),
    };
  }, [stops]);

  // Route polyline GeoJSON
  const routeGeoJSON = useMemo(() => {
    if (!routeCoords || routeCoords.length === 0) return null;
    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: routeCoords.map(([lat, lng]) => [lng, lat]),
      },
    };
  }, [routeCoords]);

  // Handle map clicks: clusters → zoom in, unclustered points → select stop
  const handleMapClick = (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature || !feature.properties) return;
    const layerId = (feature.layer?.id as string | undefined);

    if (layerId === "clusters") {
      const clusterId = feature.properties.cluster_id as number;
      const source = mapRef.current?.getSource("stops-clustered") as GeoJSONSource | undefined;
      if (!source) return;
      const geometry = feature.geometry as { type: 'Point'; coordinates: [number, number] };
      // @ts-expect-error: getClusterExpansionZoom has callback overload
      source.getClusterExpansionZoom(clusterId, (err: unknown, zoom: number) => {
        if (err || zoom == null) return;
        mapRef.current?.flyTo({
          center: [geometry.coordinates[0], geometry.coordinates[1]],
          zoom: zoom + 1,
          duration: 600,
        });
      });
    } else if (layerId === "unclustered-point") {
      const stopId = feature.properties.id as number;
      const stop = stops.find((s) => s.id === stopId);
      if (stop) handleMarkerClick(stop);
    }
  };

  const clusterPaint = useMemo(() => ({
    "circle-color": theme === "dark" ? "#3b82f6" : "#6366f1",
    "circle-radius": ["step", ["get", "point_count"], 14, 5, 18, 15, 24, 50, 30] as unknown as number,
    "circle-opacity": 0.9,
    "circle-stroke-width": 2,
    "circle-stroke-color": theme === "dark" ? "#1e293b" : "#ffffff",
  }), [theme]);

  const clusterCountPaint = useMemo(() => ({
    "text-color": "#ffffff",
  }), []);

  const unclusteredPaint = useMemo(() => ({
    "circle-color": theme === "dark" ? "#60a5fa" : "#4f46e5",
    "circle-radius": 5,
    "circle-stroke-width": 2,
    "circle-stroke-color": theme === "dark" ? "#1e293b" : "#ffffff",
  }), [theme]);

  const lineColor =
    theme === "dark"
      ? (routeColor && routeColor !== "#000000"
          ? brightenForDark(routeColor)
          : "#f59e0b")
      : (routeColor ?? "#1565C0");

  return (
    <div className="fixed top-[52px] left-0 right-0 bottom-0 z-0">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: DEFAULT_CENTER[1],
          latitude: DEFAULT_CENTER[0],
          zoom: DEFAULT_ZOOM,
        }}
        mapStyle={mapStyle}
        style={{ width: "100%", height: "100%" }}
        cursor={etaMode ? "crosshair" : undefined}
        interactiveLayerIds={["clusters", "unclustered-point"]}
        onClick={handleMapClick}
        onMoveEnd={syncBounds}
        onLoad={syncBounds}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" showCompass={false} />
        <GeolocateControl
          position="bottom-right"
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation
        />
        <AttributionControl compact />

        {/* Stop markers — clustered source */}
        <Source
          id="stops-clustered"
          type="geojson"
          data={stopsGeoJSON}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={80}
        >
          {/* Cluster circles */}
          <Layer
            id="clusters"
            type="circle"
            source="stops-clustered"
            filter={["has", "point_count"]}
            paint={clusterPaint}
        />
          {/* Cluster count labels */}
          <Layer
            id="cluster-count"
            type="symbol"
            source="stops-clustered"
            filter={["has", "point_count"]}
            layout={{
              "text-field": "{point_count_abbreviated}",
              "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
              "text-size": 13,
            }}
            paint={clusterCountPaint}
          />
          {/* Unclustered points (individual stops at high zoom) */}
          <Layer
            id="unclustered-point"
            type="circle"
            source="stops-clustered"
            filter={["!", ["has", "point_count"]]}
            paint={unclusteredPaint}
          />
        </Source>

        {/* Individual Marker for selected stop */}
        {selectedStop && (
          <Marker
            key={`selected-${selectedStop.id}`}
            longitude={selectedStop.lon}
            latitude={selectedStop.lat}
            anchor="center"
          >
            <StopMarkerContent selected heading={routeHeadings?.get(selectedStop.id)} isDark={theme === "dark"} />
          </Marker>
        )}

        {/* Individual Markers for route stops (when showing a route) */}
        {routeStopIds && visibleMarkers.filter(s => s.id !== selectedStop?.id).map((stop) => (
          <Marker
            key={stop.id}
            longitude={stop.lon}
            latitude={stop.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(stop);
            }}
          >
            <StopMarkerContent
              selected={false}
              heading={routeHeadings?.get(stop.id)}
              isDark={theme === "dark"}
            />
          </Marker>
        ))}

        {/* Vehicle markers */}
        {visibleVehicles.map((veh) => (
          <Marker
            key={veh.id}
            longitude={veh.lon}
            latitude={veh.lat}
            anchor="bottom"
          >
            <BusMarkerContent routeCode={veh.routeCode} bearing={veh.bearing} />
          </Marker>
        ))}

        {/* Route polyline */}
        {routeGeoJSON && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                "line-color": lineColor,
                "line-width": theme === "dark" ? 7 : 5,
                "line-opacity": theme === "dark" ? 0.96 : 0.85,
              }}
              layout={{
                "line-cap": "round",
                "line-join": "round",
              }}
            />
          </Source>
        )}
      </Map>

      {/* Basemap toggle */}
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
