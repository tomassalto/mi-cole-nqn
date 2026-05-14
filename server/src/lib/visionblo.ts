import crypto from 'crypto'
import NodeCache from 'node-cache'
import WebSocket from 'ws'

const VISIONBLO_BASE = 'https://owa.visionblo.com/api/neuquen/'
const APP_JS = 'https://owa.visionblo.com/web/neuquen/js/app.js'

const tokenCache = new NodeCache({ stdTTL: 21600 })

const HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Accept': '*/*',
  'Accept-Language': 'es-ES,es;q=0.9',
  'Origin': 'https://owa.visionblo.com',
  'Referer': 'https://owa.visionblo.com/web/neuquen/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
  'sec-ch-ua': '"Chromium";v="148", "Brave";v="148", "Not/A)Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-storage-access': 'none',
  'sec-gpc': '1'
}

async function getToken(): Promise<string> {
  const hit = tokenCache.get<string>('token')
  if (hit) return hit

  const envToken = process.env.VISIONBLO_TOKEN
  if (envToken) tokenCache.set('token', envToken)

  try {
    const js = await (await fetch(APP_JS)).text()
    const m = js.match(/["']?(S1V2[A-Za-z0-9*+/=_-]{5,30})["']?/)
    if (m) {
      tokenCache.set('token', m[1])
      return m[1]
    }
  } catch {}

  return envToken ?? ''
}

function computeXss(): string {
  const t = Date.now()
  const ts: number[] = [
    t & 0xff,
    (t >> 8) & 0xff,
    (t >> 16) & 0xff,
    (t >> 24) & 0xff,
    (t / 4294967296) & 0xff,
    (t / 1099511627776) & 0xff
  ]

  for (let i = 0; i < Math.pow(2, 20); i++) {
    const rand = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256))
    const n = ts.map((v, j) => v ^ rand[j]).concat(rand)
    const hash = crypto.createHash('md5').update(Buffer.from(n)).digest()
    if ((hash[14] & 0x0f) === 0 && hash[15] === 0) {
      return n.map(v => v.toString(16).padStart(2, '0')).join('')
    }
  }
  return ''
}

async function postRaw(endpoint: string, body: Record<string, unknown>): Promise<Response> {
  const token = await getToken()
  const xss = computeXss()

  const res = await fetch(`${VISIONBLO_BASE}${endpoint}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ token, xss, ...body })
  })

  if (res.status === 401) {
    tokenCache.del('token')
    const token2 = await getToken()
    const xss2 = computeXss()
    const res2 = await fetch(`${VISIONBLO_BASE}${endpoint}`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ token: token2, xss: xss2, ...body })
    })
    if (!res2.ok) throw new Error(`Visionblo ${res2.status}`)
    return res2
  }

  if (!res.ok) throw new Error(`Visionblo ${res.status}`)
  return res
}

export async function post<T = unknown>(endpoint: string, body: Record<string, unknown> = {}): Promise<T> {
  const res = await postRaw(endpoint, body)
  return res.json() as Promise<T>
}

export async function postBuffer(endpoint: string, body: Record<string, unknown> = {}): Promise<Buffer> {
  const res = await postRaw(endpoint, body)
  return Buffer.from(await res.arrayBuffer())
}

// ── Vehicle WebSocket subscription ─────────────────────────────────────────
//
// Visionblo WS protocol:
//   URL: wss://owa.visionblo.com/api/neuquen/location/{vehicleIds}/{token}
//   Messages: JSON arrays [vehicleId, lon*1e7, lat*1e7]
//             or [vehicleId] (vehicle went offline)
//   Switch:   send ["switch", id1, id2, ...] to change subscriptions
//

type VehicleCallback = (id: string, lat: number, lon: number) => void
const vehicleSubscriptions = new Map<string, Set<VehicleCallback>>()
let ws: WebSocket | null = null
async function connectVehicleWs(): Promise<void> {
  if (ws) return

  const ids = [...vehicleSubscriptions.keys()]
  if (ids.length === 0) return

  const token = await getToken()
  if (!token) return

  const url = `wss://owa.visionblo.com/api/neuquen/location/${ids.join(',')}/${encodeURIComponent(token)}`
  ws = new WebSocket(url, {
    headers: {
      'Origin': 'https://owa.visionblo.com',
      'User-Agent': HEADERS['User-Agent'],
    },
  })

  ws.onmessage = (event: WebSocket.MessageEvent) => {
    try {
      const raw = event.data
      if (typeof raw !== 'string') return

      const data = JSON.parse(raw) as number[]
      if (!Array.isArray(data) || data.length < 3) return

      const id = String(data[0])
      const lon = data[1] / 1e7
      const lat = data[2] / 1e7

      const cbs = vehicleSubscriptions.get(id)
      if (cbs) {
        for (const cb of cbs) cb(id, lat, lon)
      }
    } catch {}
  }

  ws.onclose = () => {
    ws = null
    if (vehicleSubscriptions.size > 0) {
      setTimeout(connectVehicleWs, 5000)
    }
  }

  ws.onerror = () => {
    ws?.close()
  }
}

/** Send a "switch" command to update which vehicles we're tracking. */
function switchVehicles(): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return
  const ids = [...vehicleSubscriptions.keys()]
  if (ids.length === 0) {
    ws.close()
    return
  }
  ws.send(JSON.stringify(['switch', ...ids.map(Number)]))
}

export function subscribeVehicles(ids: string[], cb: VehicleCallback): () => void {
  const hadSubscriptions = vehicleSubscriptions.size > 0

  for (const id of ids) {
    if (!vehicleSubscriptions.has(id)) {
      vehicleSubscriptions.set(id, new Set())
    }
    vehicleSubscriptions.get(id)!.add(cb)
  }

  if (!ws) {
    connectVehicleWs()
  } else if (hadSubscriptions) {
    // WS already open — just switch to include new IDs
    switchVehicles()
  }

  return () => {
    for (const id of ids) {
      vehicleSubscriptions.get(id)?.delete(cb)
      if (vehicleSubscriptions.get(id)?.size === 0) {
        vehicleSubscriptions.delete(id)
      }
    }
    // Update the WS subscription if still connected
    if (vehicleSubscriptions.size > 0) {
      switchVehicles()
    } else if (ws) {
      ws.close()
    }
  }
}
