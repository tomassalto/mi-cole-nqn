import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'

import stopsRouter from './routes/stops'
import arrivalsRouter from './routes/arrivals'
import routesRouter from './routes/routes'
import tripRouter from './routes/trip'
import favoritesRouter from './routes/favorites'
import savedConnectionsRouter from './routes/savedConnections'
import savedShortcutsRouter from './routes/savedShortcuts'
import etaRouter from './routes/eta'
import vehiclesRouter from './routes/vehicles'
import pushRouter from './routes/push'
import { subscribeVehicles } from './lib/visionblo'
import { startNotifier } from './lib/notifier'
import { initDb } from './db'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

app.use('/api/stops', stopsRouter)
app.use('/api/arrivals', arrivalsRouter)
app.use('/api/routes', routesRouter)
app.use('/api/trip', tripRouter)
app.use('/api/favorites', favoritesRouter)
app.use('/api/saved-connections', savedConnectionsRouter)
app.use('/api/saved-shortcuts', savedShortcutsRouter)
app.use('/api/eta', etaRouter)
app.use('/api/vehicles', vehiclesRouter)
app.use('/api/push', pushRouter)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() })
})

app.use(express.static(path.join(__dirname, '../../frontend/dist')))
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'))
})

app.get('/livereload', (_req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  res.write('data: refresh\n\n')
})

const server = createServer(app)

const wss = new WebSocketServer({ server, path: '/ws/vehicles' })

wss.on('connection', (ws, req) => {
  const url = new URL(req.url ?? '', `http://${req.headers.host}`)
  const ids = (url.searchParams.get('ids') ?? '').split(',').filter(Boolean)

  if (!ids.length) {
    ws.close()
    return
  }

  const unsub = subscribeVehicles(ids, (id, lat, lon) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'location', id, lat, lon }))
    }
  })

  ws.on('close', () => unsub())
  ws.on('error', () => unsub())
})

initDb()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`MiCole corriendo en http://localhost:${PORT}`)
      startNotifier()
    })
  })
  .catch(err => {
    console.error('DB init failed:', err)
    process.exit(1)
  })
