import express from 'express';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '64kb' }));
  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler); // must be last

  return app;
}
