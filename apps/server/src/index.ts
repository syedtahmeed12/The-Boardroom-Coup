import http from 'http';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { setupGateway } from './realtime/gateway.js';
import { startDeadlineWorker } from './rooms/room.service.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const HOST = '0.0.0.0';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const isProd = process.env.NODE_ENV === 'production';

const app = express();

if (CLIENT_ORIGIN) {
  const allowedOrigins = CLIENT_ORIGIN.split(',').map((o) => o.trim());
  app.use(cors({ origin: allowedOrigins, credentials: true }));
} else if (isProd) {
  // In production when frontend is served from the same server or custom origin
  app.use(cors({ origin: true, credentials: true }));
} else {
  // Development default
  app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
}

app.use(express.json({ limit: '16kb' }));

// Health check endpoint (for Render / monitoring)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// Locate static frontend build directory
const possibleWebDistPaths = [
  path.resolve(process.cwd(), 'apps/web/dist'),
  path.resolve(__dirname, '../../web/dist'),
  path.resolve(__dirname, '../web/dist'),
  path.resolve(__dirname, '../../apps/web/dist'),
];

const webDistPath = possibleWebDistPaths.find((p) => fs.existsSync(p));

if (webDistPath) {
  console.log(`[server] Serving static frontend from: ${webDistPath}`);
  app.use(express.static(webDistPath));

  // SPA fallback for non-API client routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/ws') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

const server = http.createServer(app);

setupGateway(server);
startDeadlineWorker();

server.listen(PORT, HOST, () => {
  console.log(`[server] listening on http://${HOST}:${PORT}`);
  console.log(`[server] WebSocket endpoint: ws://${HOST}:${PORT}/ws`);
});

