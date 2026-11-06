import { createHash, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

/**
 * Protects internal endpoints used by the Python workers.
 * Expects `Authorization: Bearer <INGEST_TOKEN>` and compares in constant time.
 */
export function requireIngestToken(expectedToken: string): RequestHandler {
  const expected = digest(expectedToken);
  return (req, res, next) => {
    const header = req.get('authorization') ?? '';
    const match = /^Bearer (.+)$/.exec(header);
    const provided = match?.[1];
    if (provided === undefined || !timingSafeEqual(digest(provided), expected)) {
      res.set('WWW-Authenticate', 'Bearer').status(401).json({ error: 'unauthorized' });
      return;
    }
    next();
  };
}
