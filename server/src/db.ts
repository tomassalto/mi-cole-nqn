import Database, { type Database as DatabaseType } from 'better-sqlite3'
import path from 'path'

const db: DatabaseType = new Database(path.join(__dirname, '..', 'micole.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS favorites (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL DEFAULT 'stop',
    name        TEXT NOT NULL,
    lat         REAL,
    lon         REAL,
    service_id  TEXT,
    route_code  TEXT,
    route_name  TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS saved_connections (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    origin_stop_id  INTEGER NOT NULL,
    origin_stop_name TEXT,
    dest_stop_id    INTEGER NOT NULL,
    dest_stop_name  TEXT,
    line_a_service_id INTEGER NOT NULL,
    line_a_route_code TEXT,
    line_b_service_id INTEGER NOT NULL,
    line_b_route_code TEXT,
    notifications   INTEGER DEFAULT 0,
    created_at      TEXT DEFAULT (datetime('now'))
  )
`)

const cols = db.prepare("PRAGMA table_info(favorites)").all() as Array<{ name: string }>
const colNames = cols.map(c => c.name)

if (colNames.includes('stop_id') && !colNames.includes('id')) {
  const migrate = db.transaction(() => {
    const oldRows = db.prepare('SELECT * FROM favorites').all() as Array<{
      stop_id: string
      name: string
      lat: number
      lon: number
      created_at: string
    }>
    db.exec('ALTER TABLE favorites RENAME TO favorites_old')
    db.exec(`
      CREATE TABLE IF NOT EXISTS favorites (
        id          TEXT PRIMARY KEY,
        type        TEXT NOT NULL DEFAULT 'stop',
        name        TEXT NOT NULL,
        lat         REAL,
        lon         REAL,
        service_id  TEXT,
        route_code  TEXT,
        route_name  TEXT,
        created_at  TEXT DEFAULT (datetime('now'))
      )
    `)
    const insert = db.prepare(`
      INSERT INTO favorites (id, type, name, lat, lon, created_at)
      VALUES (?, 'stop', ?, ?, ?, ?)
    `)
    for (const row of oldRows) {
      insert.run(row.stop_id, row.name, row.lat, row.lon, row.created_at)
    }
    db.exec('DROP TABLE favorites_old')
  })
  migrate()
}

export default db
