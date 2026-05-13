import { Router } from 'express'
import NodeCache from 'node-cache'
import { postBuffer } from '../lib/visionblo'

const router = Router()
const cache = new NodeCache({ stdTTL: 21600 })

interface Stop {
  id: number
  name: string
  code: string
  lat: number
  lon: number
  place: string | null
}

function parseBinary(buf: Buffer): Stop[] {
  let pos = 0
  const byte = () => buf[pos++]
  const uint16le = () => { const v = buf.readUInt16LE(pos); pos += 2; return v }
  const uint32le = () => { const v = buf.readUInt32LE(pos); pos += 4; return v }
  const int32le = () => { const v = buf.readInt32LE(pos); pos += 4; return v }
  const str = (n: number) => { const v = buf.slice(pos, pos + n).toString('utf8'); pos += n; return v }

  byte()
  uint32le()
  const numCols = byte()
  byte()

  const cols: string[] = []
  for (let i = 0; i < numCols; i++) {
    byte()
    cols.push(str(uint16le()))
  }

  const numRecords = uint32le()
  const stops: Stop[] = []

  for (let r = 0; r < numRecords && pos < buf.length; r++) {
    const internalId = uint32le()
    byte()
    const fieldCount = byte()

    const rec: Record<string, unknown> = {}
    for (let f = 0; f < fieldCount; f++) {
      const colIdx = byte()
      const type = byte()
      const name = cols[colIdx]
      if (type === 0) rec[name] = null
      else if (type === 3) rec[name] = int32le()
      else if (type === 5) rec[name] = str(uint16le())
    }

    stops.push({
      id: internalId,
      code: (rec.nombre as string ?? '').replace(/^N/i, ''),
      name: (rec.descripcion as string) ?? (rec.lugar as string) ?? (rec.nombre as string) ?? '',
      lat: ((rec.latitud as number) ?? 0) / 1e7,
      lon: ((rec.longitud as number) ?? 0) / 1e7,
      place: (rec.lugar as string) ?? null
    })
  }

  return stops
}

async function getAllStops(): Promise<Stop[]> {
  const hit = cache.get<Stop[]>('stops')
  if (hit) return hit

  const buf = await postBuffer('stops', {})
  const stops = parseBinary(buf)
  cache.set('stops', stops)
  return stops
}

router.get('/', async (req, res) => {
  const lat = parseFloat(req.query.lat as string)
  const lon = parseFloat(req.query.lon as string)
  const radius = parseFloat(req.query.radius as string) || 600

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'lat y lon son requeridos' })
  }

  try {
    const all = await getAllStops()
    const latDelta = radius / 111000
    const lonDelta = radius / (111000 * Math.cos(lat * Math.PI / 180))

    const nearby = all.filter(s =>
      Math.abs(s.lat - lat) <= latDelta &&
      Math.abs(s.lon - lon) <= lonDelta
    )

    res.json(nearby)
  } catch (err) {
    res.status(502).json({ error: (err as Error).message })
  }
})

router.get('/all', async (_req, res) => {
  try {
    res.json(await getAllStops())
  } catch (err) {
    res.status(502).json({ error: (err as Error).message })
  }
})

export default router
