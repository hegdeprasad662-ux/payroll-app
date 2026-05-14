import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use('/api', routes);
  app.use(errorHandler);
  return app;
}
