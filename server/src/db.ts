import { createClient, type Client } from '@libsql/client'
import path from 'path'

// In development: use a local SQLite file.
// In production: use Turso (set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN in environment).
const url = process.env.TURSO_DATABASE_URL
  ?? `file:${path.join(__dirname, '..', 'micole.db')}`

const authToken = process.env.TURSO_AUTH_TOKEN

export const db: Client = createClient({ url, authToken })

export async function initDb(): Promise<void> {
  await db.executeMultiple(`
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
    );

    CREATE TABLE IF NOT EXISTS saved_connections (
      id                   TEXT PRIMARY KEY,
      name                 TEXT NOT NULL,
      origin_stop_id       INTEGER NOT NULL,
      origin_stop_name     TEXT,
      transfer_stop_a_id   INTEGER,
      transfer_stop_a_name TEXT,
      board_stop_id        INTEGER,
      board_stop_name      TEXT,
      dest_stop_id         INTEGER NOT NULL,
      dest_stop_name       TEXT,
      line_a_service_id    INTEGER NOT NULL,
      line_a_route_code    TEXT,
      line_b_service_id    INTEGER NOT NULL,
      line_b_route_code    TEXT,
      notifications        INTEGER DEFAULT 0,
      created_at           TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS saved_shortcuts (
      id               TEXT PRIMARY KEY,
      name             TEXT NOT NULL,
      line_service_id  INTEGER NOT NULL DEFAULT 0,
      line_route_code  TEXT,
      origin_stop_id   INTEGER NOT NULL DEFAULT 0,
      origin_stop_name TEXT,
      dest_stop_id     INTEGER NOT NULL DEFAULT 0,
      dest_stop_name   TEXT,
      created_at       TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      shortcut_id       TEXT NOT NULL,
      endpoint          TEXT NOT NULL,
      p256dh            TEXT NOT NULL,
      auth              TEXT NOT NULL,
      minutes_threshold INTEGER NOT NULL DEFAULT 5,
      last_notified_at  TEXT,
      created_at        TEXT DEFAULT (datetime('now')),
      UNIQUE(shortcut_id, endpoint)
    );

    CREATE TABLE IF NOT EXISTS users (
      id         TEXT PRIMARY KEY,
      username   TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password   TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)

  // Column migrations — run each ALTER inside try/catch in case it already exists
  const migrations = [
    `ALTER TABLE saved_connections ADD COLUMN transfer_stop_a_id INTEGER`,
    `ALTER TABLE saved_connections ADD COLUMN transfer_stop_a_name TEXT`,
    `ALTER TABLE saved_connections ADD COLUMN board_stop_id INTEGER`,
    `ALTER TABLE saved_connections ADD COLUMN board_stop_name TEXT`,
    `ALTER TABLE saved_shortcuts ADD COLUMN line_service_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE saved_shortcuts ADD COLUMN line_route_code TEXT`,
    `ALTER TABLE saved_shortcuts ADD COLUMN origin_stop_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE saved_shortcuts ADD COLUMN origin_stop_name TEXT`,
    `ALTER TABLE saved_shortcuts ADD COLUMN dest_stop_id INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE saved_shortcuts ADD COLUMN dest_stop_name TEXT`,
    `ALTER TABLE favorites ADD COLUMN user_id TEXT`,
    `ALTER TABLE saved_connections ADD COLUMN user_id TEXT`,
    `ALTER TABLE saved_shortcuts ADD COLUMN user_id TEXT`,
    `ALTER TABLE push_subscriptions ADD COLUMN user_id TEXT`,
  ]

  for (const sql of migrations) {
    await db.execute(sql).catch(() => { /* column already exists */ })
  }
}
