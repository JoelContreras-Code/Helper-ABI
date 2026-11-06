import type { ErrorRequestHandler, RequestHandler } from 'express';
import { logger } from '../lib/logger.js';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'not_found' });
};

/** Last-resort error handler: logs the error and never leaks stack traces to clients. */
export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, error);
  if (res.headersSent) {
    return;
  }
  res.status(500).json({ error: 'internal_error' });
};
