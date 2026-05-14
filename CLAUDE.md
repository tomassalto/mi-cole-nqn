# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev    # starts server + frontend in parallel (concurrently)
npm start      # production server only (Express on compiled JS)
npm run build  # compile server TS + build frontend (Vite)
```

## Stack

**Monorepo** with two npm workspaces:
- `server/` — Node/Express + TypeScript, compiled to `server/dist/`
- `frontend/` — React 19 + TypeScript + Tailwind 4 + Vite 8, built to `frontend/dist/`

No test runner or linter configured.

## Environment

Copy `.env.example` to `.env` before running. Required variables:

| Variable | Purpose |
|---|---|
| `VISIONBLO_TOKEN` | Auth token scraped from app.js. Refreshed every 6h automatically. |
| `VITE_MAPTILER_KEY` | MapTiler API key for vector tile styles (free tier: 100k loads/month). |
| `PORT` | HTTP port, defaults to 3001 |

## Architecture

**MiCole** is a PWA bus-tracker for Neuquén, Argentina. The Express backend proxies the **Visionblo API** (`https://owa.visionblo.com/api/neuquen/`) and persists favorites/connections/shortcuts in libSQL/Turso. The frontend is a React SPA using MapLibre GL JS (via react-map-gl/maplibre).

The upstream API is **not OneBusAway**. It's a custom Visionblo API. All requests are POST JSON with `{token, xss, ...params}`:
- `token` — scraped from `https://owa.visionblo.com/web/neuquen/js/app.js` at startup
- `xss` — proof-of-work computed fresh per-request: find random bytes r such that MD5((ts XOR r) | r) has byte[14] low nibble = 0 and byte[15] = 0
- `Origin: https://owa.visionblo.com` — required header
- `VISIONBLO_XSS` is **not** an env var — it's computed dynamically in `server/src/lib/visionblo.ts`

### Backend (`server/src/`)

- `lib/visionblo.ts` — `post(endpoint, body)` helper + `subscribeVehicles()` WebSocket subscription. Handles token refresh and XSS proof-of-work automatically.
- `db.ts` — opens libSQL database (local file or Turso remote), creates tables on startup: `favorites`, `saved_connections`, `saved_shortcuts`.
- Each route file in `routes/` uses `NodeCache` with a TTL appropriate to how often that data changes:
  - `vehicles.ts` — 10 s (real-time positions), also pushed via WebSocket `/ws/vehicles`
  - `arrivals.ts` — 15 s (predictions)
  - `stops.ts` — 5 min (stable geometry, parses `stops.bin` binary with 1321 stops)
  - `routes.ts` — 1 hr (rarely changes)
- `favorites.ts`, `savedConnections.ts`, `savedShortcuts.ts` — read/write SQLite directly, no cache.
- `eta.ts` — uses arrivals data + trip schedule to compute travel time between two stops.
- All non-API routes fall through to `frontend/dist/index.html` (SPA fallback).
- `/api/health` returns `{ ok: true, ts: Date.now() }` — used by Render health check.

### Known API endpoints

| Endpoint | Method | Key params | Notes |
|---|---|---|---|
| `arrivals` | POST | `stop_id`, `first_time` | Returns arrivals array + references (services, vehicles) |
| `stops` | POST | — | Returns 140KB custom binary (1321 stops) |
| `service` | POST | `service_id`, `encode_polyline`, `vehicles` | Returns route shape (encoded polyline), color, stop sequence |
| `trip` | POST | `trip_id` | Returns trip details. `trip_id` comes from arrivals response. |

#### `service` response shape
```json
{
  "service": {
    "code": "3",
    "name": "Rincon de Emilio - Limay",
    "color": "000000",
    "path": "<encoded polyline>",
    "stops": [301918, 301348],
    "headings": [293, 239]
  },
  "vehicles": []
}
```
`service.stops` contains internal Visionblo integer IDs (not the N-prefixed IDs from the binary).

### Vehicle real-time positions (WebSocket)

Vehicle positions are **NOT** available via REST. They come exclusively through the Visionblo WebSocket.

**Connection flow** (implemented in `server/src/lib/visionblo.ts`):

1. **URL**: `wss://owa.visionblo.com/api/neuquen/location/{vehicleIds}/{token}`
   - `vehicleIds` — comma-separated numeric IDs (e.g. `71632,137992,67726`)
   - `token` — same auth token used for REST API (scraped from app.js)
   - Must include `Origin: https://owa.visionblo.com` header or connection gets 504

2. **Incoming messages**: JSON arrays `[vehicleId, lon×1e7, lat×1e7]`
   - Coordinates are **integers** divided by 10,000,000 (e.g. `-680357263` → `-68.0357263`)
   - **Order is [id, longitude, latitude]** — NOT [id, lat, lon]!
   - A message with only `[vehicleId]` (length 1) means vehicle went offline

3. **Switch command**: To change tracked vehicles on an open connection, send:
   `["switch", id1, id2, id3, ...]` (IDs as numbers, not strings)

4. **Server proxy**: Our server (`/ws/vehicles?ids=...`) connects to Visionblo WS and relays positions to frontend clients as `{type: "location", id, lat, lon}` (JSON objects, human-readable floats).

**Frontend flow** (in `ArrivalsPanel.tsx`):
- When a stop is selected, vehicle IDs come from arrivals + `raw.references.vehicles`
- `references.vehicles` only has metadata (name, wheelchair_access) — **NO lat/lon**
- Vehicles start with `lat=0, lon=0` and only appear on map once WebSocket sends first position
- `updateVehicles()` filters out vehicles where `lat === 0 && lon === 0`

### Visionblo API authentication

All REST requests go through `post(endpoint, body)` in `visionblo.ts`:
- **Token**: scraped from `https://owa.visionblo.com/web/neuquen/js/app.js` via regex `/(S1V2[A-Za-z0-9*+/=_-]{5,30})/`. Cached 6h in NodeCache. Falls back to `VISIONBLO_TOKEN` env var.
- **XSS proof-of-work**: computed per-request in `computeXss()`. Algorithm: generate random bytes `r`, XOR with timestamp `ts`, concatenate, MD5 hash — accepted when `hash[14] & 0x0f === 0 && hash[15] === 0`.
- **Required header**: `Origin: https://owa.visionblo.com` (all requests, REST and WS).

### Frontend (`frontend/src/`)

React 19 SPA. Entry point is `main.tsx` → `App.tsx`. State is managed via React Context (no Redux/Zustand).

Context tree:
- `AppContext` — app-wide state (selected stop, route, vehicles, stops array)
- `MapContext` — map-specific state (etaMode, connection/shortcut creation steps, dialog state)
- `FavoritesContext` — favorites list
- `ToastContext` — toast notifications

Component responsibilities:
- `components/Map/MapView.tsx` — MapLibre GL JS map (via `react-map-gl/maplibre`). Vector tile styles from MapTiler (dark: `base-v4-dark` with custom color patches; light: `basic-v2`/`streets-v2`). Stop markers are **viewport-filtered** (zoom ≥ 15 required; only stops within current bounds are rendered). Vehicle markers appear via WebSocket real-time positions. Route polyline rendered as GeoJSON Source+Layer. Supports "Calmo"/"Detalle" basemap toggle.
- `components/Panel/ArrivalsPanel.tsx` — bottom-sheet (mobile) / left-panel (desktop) showing arrivals for selected stop. Auto-refreshes every 15 s. Connects to `/ws/vehicles` to receive real-time vehicle positions.
- `components/Panel/ScheduleView.tsx` — full trip schedule (all stops + times) for a specific bus trip.
- `components/Drawer/FavoritesDrawer.tsx` — slide-in drawer for saved stops.
- `components/Dialogs/` — ETA, Connection, Shortcut, Consultation dialogs.
- `components/layout/TopBar.tsx` — top navigation bar.

### Deployment

Deployed on **Render** (free tier). `render.yaml` in repo root defines the service.
- Build: `npm ci && npm run build`
- Start: `npm start` (runs Express which serves `frontend/dist/` as static files)
- Health check: `/api/health`
- `VISIONBLO_TOKEN` must be set manually in Render dashboard (not in repo).
- **UptimeRobot** pings `/api/health` every 5 min to prevent cold starts.
