import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Built by `npm run web:build`. Resolves correctly from both src/ (tsx) and
// dist/ (compiled) because both sit one level below the repo root.
const WEB_DIST = path.resolve(__dirname, '../web/dist');

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '64kb' }));
  app.use('/api', routes);

  // Serve the client from the same origin so no CORS is needed. Hash routing
  // means only "/" has to resolve to index.html. In dev, use `npm run web:dev`
  // instead (Vite proxies /api here) — this branch is skipped if there is no build.
  if (existsSync(WEB_DIST)) {
    app.use(express.static(WEB_DIST));
  }

  app.use(notFoundHandler);
  app.use(errorHandler); // must be last

  return app;
}
