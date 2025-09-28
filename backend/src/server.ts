import cors from 'cors';
import express from 'express';

import { traceRouter } from './trace/trace.router.js';

export const createServer = () => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/trace', traceRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    void _next;
    // eslint-disable-next-line no-console
    console.error('Unhandled error', err);
    res.status(500).json({ message: 'Internal server error' });
  });

  return app;
};
