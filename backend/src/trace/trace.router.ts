import express from 'express';
import { ZodError } from 'zod';

import { traceRequestSchema } from './trace.schema.js';
import { traceService } from './trace.service.js';

export const traceRouter = express.Router();

const asyncHandler = (handler: express.RequestHandler): express.RequestHandler => {
  return (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
};

const handleTraceCreation: express.RequestHandler = async (req, res) => {
  try {
    const parsed = traceRequestSchema.parse(req.body);
    const result = await traceService.buildTrace(parsed);
    res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: '入力内容をご確認ください', details: error.issues });
      return;
    }
    throw error;
  }
};

const handleHistory: express.RequestHandler = async (_req, res) => {
  const recent = await traceService.getRecentHistory();
  res.json({ items: recent });
};

traceRouter.post('/', asyncHandler(handleTraceCreation));
traceRouter.get('/history', asyncHandler(handleHistory));
