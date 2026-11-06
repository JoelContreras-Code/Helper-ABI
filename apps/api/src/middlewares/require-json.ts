import type { RequestHandler } from 'express';

const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH']);

/**
 * Write requests must be `application/json`. Besides consistency, this blocks
 * cross-site "simple requests" (text/plain forms) from other web pages: a JSON
 * request from a foreign origin needs a CORS preflight, which CORS rejects.
 */
export const requireJson: RequestHandler = (req, res, next) => {
  if (METHODS_WITH_BODY.has(req.method) && !req.is('application/json')) {
    res.status(415).json({ error: 'unsupported_media_type' });
    return;
  }
  next();
};
