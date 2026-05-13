"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const node_cache_1 = __importDefault(require("node-cache"));
const visionblo_1 = require("../lib/visionblo");
const router = (0, express_1.Router)();
const shapeCache = new node_cache_1.default({ stdTTL: 3600 });
const vehicleCache = new node_cache_1.default({ stdTTL: 10 });
router.get('/:serviceId/shape', async (req, res) => {
    const serviceId = parseInt(req.params.serviceId);
    if (isNaN(serviceId))
        return res.status(400).json({ error: 'serviceId debe ser numérico' });
    const hit = shapeCache.get(serviceId);
    if (hit)
        return res.json(hit);
    try {
        const data = await (0, visionblo_1.post)('service', {
            service_id: serviceId,
            encode_polyline: true,
            vehicles: false
        });
        const svc = data.service ?? {};
        const result = {
            encoded: svc.path ?? null,
            color: svc.color ? `#${svc.color}` : '#1565C0',
            code: svc.code ?? String(serviceId),
            name: svc.name ?? '',
            stops: svc.stops ?? []
        };
        shapeCache.set(serviceId, result);
        res.json(result);
    }
    catch (err) {
        res.status(502).json({ error: err.message });
    }
});
router.get('/:serviceId/vehicles', async (req, res) => {
    const serviceId = parseInt(req.params.serviceId);
    if (isNaN(serviceId))
        return res.status(400).json({ error: 'serviceId debe ser numérico' });
    const cacheKey = `v_${serviceId}`;
    const hit = vehicleCache.get(cacheKey);
    if (hit)
        return res.json(hit);
    try {
        const data = await (0, visionblo_1.post)('service', {
            service_id: serviceId,
            encode_polyline: false,
            vehicles: true
        });
        const vehicles = (data.vehicles ?? [])
            .filter(v => v.lat != null && v.lon != null)
            .map(v => ({
            id: v.id ?? v.vehicle_id,
            lat: v.lat,
            lon: v.lon,
            bearing: v.bearing ?? v.heading ?? 0,
            name: v.name ?? null
        }));
        vehicleCache.set(cacheKey, vehicles);
        res.json(vehicles);
    }
    catch (err) {
        res.status(502).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=routes.js.map