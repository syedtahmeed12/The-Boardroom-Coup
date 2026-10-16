"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const gateway_js_1 = require("./realtime/gateway.js");
const room_service_js_1 = require("./rooms/room.service.js");
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const HOST = '0.0.0.0';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const isProd = process.env.NODE_ENV === 'production';
const app = (0, express_1.default)();
if (CLIENT_ORIGIN) {
    const allowedOrigins = CLIENT_ORIGIN.split(',').map((o) => o.trim());
    app.use((0, cors_1.default)({ origin: allowedOrigins, credentials: true }));
}
else if (isProd) {
    // In production when frontend is served from the same server or custom origin
    app.use((0, cors_1.default)({ origin: true, credentials: true }));
}
else {
    // Development default
    app.use((0, cors_1.default)({ origin: 'http://localhost:5173', credentials: true }));
}
app.use(express_1.default.json({ limit: '16kb' }));
// Health check endpoint (for Render / monitoring)
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', ts: new Date().toISOString() });
});
// Locate static frontend build directory
const possibleWebDistPaths = [
    path_1.default.resolve(process.cwd(), 'apps/web/dist'),
    path_1.default.resolve(__dirname, '../../web/dist'),
    path_1.default.resolve(__dirname, '../web/dist'),
    path_1.default.resolve(__dirname, '../../apps/web/dist'),
];
const webDistPath = possibleWebDistPaths.find((p) => fs_1.default.existsSync(p));
if (webDistPath) {
    console.log(`[server] Serving static frontend from: ${webDistPath}`);
    app.use(express_1.default.static(webDistPath));
    // SPA fallback for non-API client routes
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/ws') || req.path.startsWith('/health')) {
            return next();
        }
        res.sendFile(path_1.default.join(webDistPath, 'index.html'));
    });
}
const server = http_1.default.createServer(app);
(0, gateway_js_1.setupGateway)(server);
(0, room_service_js_1.startDeadlineWorker)();
server.listen(PORT, HOST, () => {
    console.log(`[server] listening on http://${HOST}:${PORT}`);
    console.log(`[server] WebSocket endpoint: ws://${HOST}:${PORT}/ws`);
});
