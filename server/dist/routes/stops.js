"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const node_cache_1 = __importDefault(require("node-cache"));
const visionblo_1 = require("../lib/visionblo");
const router = (0, express_1.Router)();
const cache = new node_cache_1.default({ stdTTL: 21600 });
function parseBinary(buf) {
    let pos = 0;
    const byte = () => buf[pos++];
    const uint16le = () => { const v = buf.readUInt16LE(pos); pos += 2; return v; };
    const uint32le = () => { const v = buf.readUInt32LE(pos); pos += 4; return v; };
    const int32le = () => { const v = buf.readInt32LE(pos); pos += 4; return v; };
    const str = (n) => { const v = buf.slice(pos, pos + n).toString('utf8'); pos += n; return v; };
    byte();
    uint32le();
    const numCols = byte();
    byte();
    const cols = [];
    for (let i = 0; i < numCols; i++) {
        byte();
        cols.push(str(uint16le()));
    }
    const numRecords = uint32le();
    const stops = [];
    for (let r = 0; r < numRecords && pos < buf.length; r++) {
        const internalId = uint32le();
        byte();
        const fieldCount = byte();
        const rec = {};
        for (let f = 0; f < fieldCount; f++) {
            const colIdx = byte();
            const type = byte();
            const name = cols[colIdx];
            if (type === 0)
                rec[name] = null;
            else if (type === 3)
                rec[name] = int32le();
            else if (type === 5)
                rec[name] = str(uint16le());
        }
        stops.push({
            id: internalId,
            code: (rec.nombre ?? '').replace(/^N/i, ''),
            name: rec.descripcion ?? rec.lugar ?? rec.nombre ?? '',
            lat: (rec.latitud ?? 0) / 1e7,
            lon: (rec.longitud ?? 0) / 1e7,
            place: rec.lugar ?? null
        });
    }
    return stops;
}
async function getAllStops() {
    const hit = cache.get('stops');
    if (hit)
        return hit;
    const buf = await (0, visionblo_1.postBuffer)('stops', {});
    const stops = parseBinary(buf);
    cache.set('stops', stops);
    return stops;
}
router.get('/', async (req, res) => {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const radius = parseFloat(req.query.radius) || 600;
    if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'lat y lon son requeridos' });
    }
    try {
        const all = await getAllStops();
        const latDelta = radius / 111000;
        const lonDelta = radius / (111000 * Math.cos(lat * Math.PI / 180));
        const nearby = all.filter(s => Math.abs(s.lat - lat) <= latDelta &&
            Math.abs(s.lon - lon) <= lonDelta);
        res.json(nearby);
    }
    catch (err) {
        res.status(502).json({ error: err.message });
    }
});
router.get('/all', async (_req, res) => {
    try {
        res.json(await getAllStops());
    }
    catch (err) {
        res.status(502).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=stops.js.map