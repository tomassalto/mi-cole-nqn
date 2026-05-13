# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev    # dev server with hot-reload (node --watch)
npm start      # production server
```

No test runner or linter is configured. There is no build step — the frontend is plain ES modules served statically.

## Environment

Copy `.env.example` to `.env` before running. Required variables:

| Variable | Purpose |
|---|---|
| `VISIONBLO_TOKEN` | Auth token from app.js (e.g. `S1V2Zpia995yNe75w*vK`). Refreshed every 6h from live JS. |
| `PORT` | HTTP port, defaults to 3000 |

## Architecture

**MiCole** is a PWA bus-tracker for Neuquén, Argentina. The Node/Express backend proxies the **Visionblo API** (`https://owa.visionblo.com/api/neuquen/`) and persists favorites in SQLite; the frontend is a Leaflet SPA with no framework.

The upstream API is **not OneBusAway**. It's a custom Visionblo API. All requests are POST JSON with `{token, xss, ...params}`:
- `token` — scraped from `https://owa.visionblo.com/web/neuquen/js/app.js` at startup
- `xss` — proof-of-work computed fresh per-request: find random bytes r such that MD5((ts XOR r) | r) has byte[14] low nibble = 0 and byte[15] = 0
- `Origin: https://owa.visionblo.com` — required header (Cole runs as an iframe on that domain)

### Backend (`server.js`, `db.js`, `lib/`, `routes/`)

- `lib/visionblo.js` — `post(endpoint, body)` and `get(endpoint, params)` helpers. Handles token refresh and XSS proof-of-work automatically.
- `db.js` — opens `micole.db` (better-sqlite3) and creates the `favorites` table on startup.
- Each route file in `routes/` owns its own `NodeCache` instance with a TTL appropriate to how often that data changes:
  - `vehicles.js` — 10 s (real-time positions)
  - `arrivals.js` — 15 s (predictions)
  - `stops.js` — 5 min (stable geometry)
  - `routes.js` — 1 hr (rarely changes)
- `favorites.js` skips caching entirely — it reads/writes SQLite directly.
- The ETA route (`eta.js`) uses arrivals data plus trip schedule to compute travel time between two stops.
- All non-API routes fall through to `public/index.html` (SPA fallback).
- `/health` returns `{ ok: true, ts: Date.now() }` — used by Railway's health check.

### Known API endpoints

| Endpoint | Method | Key params | Notes |
|---|---|---|---|
| `arrivals` | POST | `stop_id`, `first_time` | Returns arrivals array + references (services, vehicles) |
| `stops` | POST | — | Returns 140KB custom binary (columns: nombre, latitud, longitud, descripcion, lugar) |
| `service` | POST | `service_id`, `encode_polyline`, `vehicles` | Returns route shape (encoded polyline), color, stop sequence + optionally active vehicles |
| `trip` | POST | `trip_id` | Returns trip details. `trip_id` comes from arrivals response. |

#### `service` response shape
```json
{
  "service": {
    "code": "3",
    "name": "Rincon de Emilio - Limay",
    "color": "000000",
    "path": "<encoded polyline, present when encode_polyline:true>",
    "stops": [301918, 301348, ...],
    "headings": [293, 239, ...]
  },
  "vehicles": [...]
}
```
`service.stops` contains internal Visionblo integer IDs (not the N-prefixed IDs from the binary).
`vehicles` key only appears when there are active buses on the route (`vehicles: true` in request).

### Frontend (`public/`)

All JS is in `public/js/` as ES modules (no bundler). `index.html` loads only `app.js` as `type="module"`; everything else is imported from there.

Module responsibilities:
- `app.js` — entry point; wires `map.js`, `panel.js`, `favorites.js`, `eta.js` together and owns the ETA flow orchestration.
- `api.js` — thin fetch wrappers for every backend endpoint. The only file that knows API paths.
- `map.js` — Leaflet map; manages stop markers (added lazily on `moveend`), vehicle markers (polled every 10 s), and the active route polyline. Exposes `setEtaMode(bool)` to switch cursor to crosshair for destination picking.
- `panel.js` — bottom-sheet arrivals panel; auto-refreshes every 15 s while open. Dispatches `favorites-changed` DOM event when the star button is toggled.
- `favorites.js` — slide-in drawer; listens for `favorites-changed` to re-render.
- `eta.js` — dialog for "how long until I arrive at another stop?"; activates ETA mode on the map when a route is selected, then waits for `onDestinationSelected()` to be called by `app.js`.

Route polyline shapes are Google-encoded polylines decoded in `map.js:decodePolyline`.

### Deployment

Deployed on Railway. `railway.toml` sets `startCommand = "node server.js"` and health check path `/health`.
