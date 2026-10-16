import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const backendHost = process.env.BACKEND_URL || 'http://localhost:3001';
const wsHost = process.env.BACKEND_WS_URL || backendHost.replace(/^http/, 'ws');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@boardroom/contracts': path.resolve(__dirname, '../../packages/contracts/src/index.ts'),
      '@boardroom/game-content': path.resolve(__dirname, '../../packages/game-content/src/index.ts'),
    },
  },
  server: {
    port: parseInt(process.env.PORT || '5173', 10),
    proxy: {
      '/ws': {
        target: wsHost,
        ws: true,
        changeOrigin: true,
      },
      '/health': {
        target: backendHost,
        changeOrigin: true,
      },
    },
  },
});
