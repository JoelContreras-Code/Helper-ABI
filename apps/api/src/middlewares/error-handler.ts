import type { ErrorRequestHandler, RequestHandler } from 'express';
import { UniqueConstraintError, ValidationError as SequelizeValidationError } from 'sequelize';
import { ZodError } from 'zod';
import { HttpError } from '../lib/http-error.js';
import { logger } from '../lib/logger.js';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'not_found' });
};

/** Errors raised by express.json() carry an HTTP status and a `type`. */
function bodyParserError(error: unknown): { status: number; code: string } | null {
  if (typeof error !== 'object' || error === null) return null;
  const { status, type } = error as { status?: unknown; type?: unknown };
  if (typeof status !== 'number' || status < 400 || status >= 500) return null;
  if (type === 'entity.parse.failed') return { status: 400, code: 'invalid_json' };
  if (type === 'entity.too.large') return { status: 413, code: 'payload_too_large' };
  return { status, code: 'bad_request' };
}

/** Converts known errors to JSON responses; never leaks stack traces to clients. */
export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  if (res.headersSent) {
    return;
  }
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.code, message: error.message, ...error.details });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'validation_error',
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }
  if (error instanceof UniqueConstraintError) {
    res.status(409).json({ error: 'conflict' });
    return;
  }
  if (error instanceof SequelizeValidationError) {
    res.status(400).json({
      error: 'validation_error',
      issues: error.errors.map((e) => ({ path: e.path ?? '', message: e.message })),
    });
    return;
  }
  const parserError = bodyParserError(error);
  if (parserError) {
    res.status(parserError.status).json({ error: parserError.code });
    return;
  }
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, error);
  res.status(500).json({ error: 'internal_error' });
};
