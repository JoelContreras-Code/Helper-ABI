import { rateLimit } from 'express-rate-limit';

/** Per-IP rate limiter that answers with the API's JSON error format. */
export function createRateLimiter(limitPerMinute: number) {
  return rateLimit({
    windowMs: 60_000,
    limit: limitPerMinute,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: 'rate_limited' });
    },
  });
}
