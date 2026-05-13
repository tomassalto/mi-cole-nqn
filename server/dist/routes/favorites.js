"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
router.get('/', (_req, res) => {
    res.json(db_1.default.prepare('SELECT * FROM favorites ORDER BY type, created_at DESC').all());
});
router.post('/stop/:stopId', (req, res) => {
    const stopId = req.params.stopId;
    const { name, lat, lon } = req.body;
    if (!name || lat == null || lon == null) {
        return res.status(400).json({ error: 'name, lat, lon son requeridos' });
    }
    db_1.default.prepare(`
    INSERT OR REPLACE INTO favorites (id, type, name, lat, lon, created_at)
    VALUES (?, 'stop', ?, ?, ?, datetime('now'))
  `).run(stopId, name, lat, lon);
    res.json({ ok: true });
});
router.delete('/stop/:stopId', (req, res) => {
    db_1.default.prepare("DELETE FROM favorites WHERE id = ? AND type = 'stop'").run(req.params.stopId);
    res.json({ ok: true });
});
router.post('/line', (req, res) => {
    const { serviceId, routeCode, routeName } = req.body;
    if (!serviceId || !routeCode) {
        return res.status(400).json({ error: 'serviceId y routeCode son requeridos' });
    }
    const id = `line_${serviceId}`;
    db_1.default.prepare(`
    INSERT OR REPLACE INTO favorites (id, type, name, service_id, route_code, route_name, created_at)
    VALUES (?, 'line', ?, ?, ?, ?, datetime('now'))
  `).run(id, routeName || routeCode, serviceId, routeCode, routeName);
    res.json({ ok: true });
});
router.delete('/line/:serviceId', (req, res) => {
    const id = `line_${req.params.serviceId}`;
    db_1.default.prepare("DELETE FROM favorites WHERE id = ? AND type = 'line'").run(id);
    res.json({ ok: true });
});
exports.default = router;
//# sourceMappingURL=favorites.js.map