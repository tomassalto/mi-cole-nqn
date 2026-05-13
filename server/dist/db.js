"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const db = new better_sqlite3_1.default(path_1.default.join(__dirname, '..', 'micole.db'));
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
`);
const cols = db.prepare("PRAGMA table_info(favorites)").all();
const colNames = cols.map(c => c.name);
if (colNames.includes('stop_id') && !colNames.includes('id')) {
    const migrate = db.transaction(() => {
        const oldRows = db.prepare('SELECT * FROM favorites').all();
        db.exec('ALTER TABLE favorites RENAME TO favorites_old');
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
    `);
        const insert = db.prepare(`
      INSERT INTO favorites (id, type, name, lat, lon, created_at)
      VALUES (?, 'stop', ?, ?, ?, ?)
    `);
        for (const row of oldRows) {
            insert.run(row.stop_id, row.name, row.lat, row.lon, row.created_at);
        }
        db.exec('DROP TABLE favorites_old');
    });
    migrate();
}
exports.default = db;
//# sourceMappingURL=db.js.map