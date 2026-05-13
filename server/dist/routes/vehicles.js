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
router.get('/:tripId', async (req, res) => {
    const tripId = parseInt(req.params.tripId);
    if (isNaN(tripId))
        return res.status(400).json({ error: 'tripId inválido' });
    const cached = cache.get(tripId);
    if (cached)
        return res.json(cached);
    try {
        const data = await (0, visionblo_1.post)('trip', { trip_id: tripId });
        const stops = (data.stops ?? []).map(s => ({
            stopId: s.stop_id,
            timestamp: s.timestamp
        }));
        cache.set(tripId, { stops });
        res.json({ stops });
    }
    catch (err) {
        res.status(502).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=vehicles.js.map