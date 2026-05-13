"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const ws_1 = require("ws");
const http_1 = require("http");
const stops_1 = __importDefault(require("./routes/stops"));
const arrivals_1 = __importDefault(require("./routes/arrivals"));
const routes_1 = __importDefault(require("./routes/routes"));
const favorites_1 = __importDefault(require("./routes/favorites"));
const eta_1 = __importDefault(require("./routes/eta"));
const vehicles_1 = __importDefault(require("./routes/vehicles"));
const visionblo_1 = require("./lib/visionblo");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/stops', stops_1.default);
app.use('/api/arrivals', arrivals_1.default);
app.use('/api/routes', routes_1.default);
app.use('/api/favorites', favorites_1.default);
app.use('/api/eta', eta_1.default);
app.use('/api/vehicles', vehicles_1.default);
app.get('/api/health', (_req, res) => {
    res.json({ ok: true, ts: Date.now() });
});
app.use(express_1.default.static(path_1.default.join(__dirname, '../../frontend/dist')));
app.use((_req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../frontend/dist/index.html'));
});
app.get('/livereload', (_req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write('data: refresh\n\n');
});
const server = (0, http_1.createServer)(app);
const wss = new ws_1.WebSocketServer({ server, path: '/ws/vehicles' });
wss.on('connection', (ws, req) => {
    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    const ids = (url.searchParams.get('ids') ?? '').split(',').filter(Boolean);
    if (!ids.length) {
        ws.close();
        return;
    }
    const unsub = (0, visionblo_1.subscribeVehicles)(ids, (id, lat, lon) => {
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'location', id, lat, lon }));
        }
    });
    ws.on('close', () => unsub());
    ws.on('error', () => unsub());
});
server.listen(PORT, () => {
    console.log(`MiCole corriendo en http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map