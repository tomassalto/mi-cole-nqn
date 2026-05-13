"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.post = post;
exports.postBuffer = postBuffer;
exports.subscribeVehicles = subscribeVehicles;
const crypto_1 = __importDefault(require("crypto"));
const node_cache_1 = __importDefault(require("node-cache"));
const ws_1 = __importDefault(require("ws"));
const VISIONBLO_BASE = 'https://owa.visionblo.com/api/neuquen/';
const APP_JS = 'https://owa.visionblo.com/web/neuquen/js/app.js';
const tokenCache = new node_cache_1.default({ stdTTL: 21600 });
const HEADERS = {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Accept-Language': 'es-ES,es;q=0.9',
    'Origin': 'https://owa.visionblo.com',
    'Referer': 'https://owa.visionblo.com/web/neuquen/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
    'sec-ch-ua': '"Chromium";v="148", "Brave";v="148", "Not/A)Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-storage-access': 'none',
    'sec-gpc': '1'
};
async function getToken() {
    const hit = tokenCache.get('token');
    if (hit)
        return hit;
    const envToken = process.env.VISIONBLO_TOKEN;
    if (envToken)
        tokenCache.set('token', envToken);
    try {
        const js = await (await fetch(APP_JS)).text();
        const m = js.match(/["']?(S1V2[A-Za-z0-9*+/=_-]{5,30})["']?/);
        if (m) {
            tokenCache.set('token', m[1]);
            return m[1];
        }
    }
    catch { }
    return envToken ?? '';
}
function computeXss() {
    const t = Date.now();
    const ts = [
        t & 0xff,
        (t >> 8) & 0xff,
        (t >> 16) & 0xff,
        (t >> 24) & 0xff,
        (t / 4294967296) & 0xff,
        (t / 1099511627776) & 0xff
    ];
    for (let i = 0; i < Math.pow(2, 20); i++) {
        const rand = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256));
        const n = ts.map((v, j) => v ^ rand[j]).concat(rand);
        const hash = crypto_1.default.createHash('md5').update(Buffer.from(n)).digest();
        if ((hash[14] & 0x0f) === 0 && hash[15] === 0) {
            return n.map(v => v.toString(16).padStart(2, '0')).join('');
        }
    }
    return '';
}
async function postRaw(endpoint, body) {
    const token = await getToken();
    const xss = computeXss();
    const res = await fetch(`${VISIONBLO_BASE}${endpoint}`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ token, xss, ...body })
    });
    if (res.status === 401) {
        tokenCache.del('token');
        const token2 = await getToken();
        const xss2 = computeXss();
        const res2 = await fetch(`${VISIONBLO_BASE}${endpoint}`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({ token: token2, xss: xss2, ...body })
        });
        if (!res2.ok)
            throw new Error(`Visionblo ${res2.status}`);
        return res2;
    }
    if (!res.ok)
        throw new Error(`Visionblo ${res.status}`);
    return res;
}
async function post(endpoint, body = {}) {
    const res = await postRaw(endpoint, body);
    return res.json();
}
async function postBuffer(endpoint, body = {}) {
    const res = await postRaw(endpoint, body);
    return Buffer.from(await res.arrayBuffer());
}
const vehicleSubscriptions = new Map();
let ws = null;
function connectVehicleWs() {
    if (ws)
        return;
    const proto = process.env.WS_PROTO ?? 'wss:';
    const host = process.env.WS_HOST ?? 'owa.visionblo.com';
    ws = new ws_1.default(`${proto}//${host}/api/neuquen/vehicles/ws`);
    ws.onmessage = (event) => {
        try {
            const raw = event.data;
            if (typeof raw !== 'string')
                return;
            const data = JSON.parse(raw);
            if (data.id && data.lat != null && data.lon != null) {
                const cbs = vehicleSubscriptions.get(String(data.id));
                if (cbs) {
                    for (const cb of cbs)
                        cb(String(data.id), data.lat, data.lon);
                }
            }
        }
        catch { }
    };
    ws.onclose = () => {
        ws = null;
        setTimeout(connectVehicleWs, 5000);
    };
    ws.onerror = () => {
        ws?.close();
    };
}
function subscribeVehicles(ids, cb) {
    for (const id of ids) {
        if (!vehicleSubscriptions.has(id)) {
            vehicleSubscriptions.set(id, new Set());
        }
        vehicleSubscriptions.get(id).add(cb);
    }
    if (!ws)
        connectVehicleWs();
    return () => {
        for (const id of ids) {
            vehicleSubscriptions.get(id)?.delete(cb);
            if (vehicleSubscriptions.get(id)?.size === 0) {
                vehicleSubscriptions.delete(id);
            }
        }
    };
}
//# sourceMappingURL=visionblo.js.map