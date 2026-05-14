import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createApp } from './app.js';
import { config } from './config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = createApp();

// In production, serve the built frontend from this same process so the user
// only deploys one service.  `frontend/dist` is produced by `npm run build`.
if (config.nodeEnv === 'production') {
  const distDir = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(distDir));
  // SPA fallback: any non-/api path serves index.html
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
  console.log('[payroll-backend] serving frontend from', distDir);
}

app.listen(config.port, '0.0.0.0', () => {
  console.log(`[payroll-backend] listening on 0.0.0.0:${config.port} (env=${config.nodeEnv})`);
});
