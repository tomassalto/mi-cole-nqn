"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const node_cache_1 = __importDefault(require("node-cache"));
const visionblo_1 = require("../lib/visionblo");
const router = (0, express_1.Router)();
const cache = new node_cache_1.default({ stdTTL: 15 });
router.post('/:stopId', async (req, res) => {
    const stopId = parseInt(req.params.stopId);
    if (isNaN(stopId))
        return res.status(400).json({ error: 'stopId inválido' });
    const firstTime = req.body.first_time ?? Date.now();
    const cacheKey = `${stopId}_${firstTime}`;
    const cached = cache.get(cacheKey);
    if (cached)
        return res.json(cached);
    try {
        const data = await (0, visionblo_1.post)('arrivals', {
            stop_id: stopId,
            first_time: firstTime
        });
        cache.set(cacheKey, data);
        res.json(data);
    }
    catch (err) {
        res.status(502).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=arrivals.js.map