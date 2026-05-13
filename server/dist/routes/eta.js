"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const node_cache_1 = __importDefault(require("node-cache"));
const visionblo_1 = require("../lib/visionblo");
const router = (0, express_1.Router)();
const cache = new node_cache_1.default({ stdTTL: 60 });
router.get('/', async (req, res) => {
    const fromStop = parseInt(req.query.fromStop);
    const toStop = parseInt(req.query.toStop);
    const serviceId = parseInt(req.query.serviceId);
    if (isNaN(fromStop) || isNaN(toStop) || isNaN(serviceId)) {
        return res.status(400).json({ error: 'fromStop, toStop y serviceId son requeridos' });
    }
    const cacheKey = `${fromStop}_${toStop}_${serviceId}`;
    const cached = cache.get(cacheKey);
    if (cached)
        return res.json(cached);
    try {
        const arrivalsData = await (0, visionblo_1.post)('arrivals', { stop_id: fromStop, first_time: Date.now() });
        const arrival = arrivalsData.arrivals.find(a => a.service_id === serviceId);
        if (!arrival) {
            return res.json({
                error: 'No hay información de llegada para esa línea',
                minutesToFrom: null,
                minutesToDest: null,
                routeCode: String(serviceId),
                predicted: false
            });
        }
        const now = Date.now();
        const minutesToFrom = Math.max(0, Math.round((arrival.predicted ?? arrival.scheduled - now) / 60000));
        const shapeData = await (0, visionblo_1.post)('service', { service_id: serviceId, encode_polyline: false, vehicles: false });
        const stops = shapeData.service?.stops ?? [];
        const fromIdx = stops.indexOf(fromStop);
        const toIdx = stops.indexOf(toStop);
        let minutesToDest = null;
        if (fromIdx >= 0 && toIdx > fromIdx) {
            minutesToDest = minutesToFrom + (toIdx - fromIdx) * 2;
        }
        const result = {
            minutesToFrom,
            minutesToDest,
            routeCode: String(serviceId),
            predicted: arrival.predicted != null
        };
        cache.set(cacheKey, result);
        res.json(result);
    }
    catch (err) {
        res.status(502).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=eta.js.map