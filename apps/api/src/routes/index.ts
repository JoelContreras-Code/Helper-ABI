import { Router } from 'express';
import { ingestController } from '../controllers/ingest-controller.js';
import { intelController } from '../controllers/intel-controller.js';
import { sourcesController } from '../controllers/sources-controller.js';
import { syncJobsController } from '../controllers/sync-jobs-controller.js';
import { createRateLimiter } from '../middlewares/rate-limit.js';
import { requireIngestToken } from '../middlewares/require-ingest-token.js';
import type { Database } from '../models/index.js';

export interface RateLimits {
  /** Requests per minute to POST /api/ingest. */
  ingestPerMinute: number;
  /** Requests per minute to write endpoints of /api/sync-jobs. */
  syncJobsPerMinute: number;
}

export const DEFAULT_RATE_LIMITS: RateLimits = { ingestPerMinute: 120, syncJobsPerMinute: 30 };

/** Business routes mounted under /api. */
export function createApiRouter(db: Database, ingestToken: string, limits: RateLimits): Router {
  const router = Router();
  const internalAuth = requireIngestToken(ingestToken);
  const ingestLimiter = createRateLimiter(limits.ingestPerMinute);
  const syncJobsLimiter = createRateLimiter(limits.syncJobsPerMinute);

  const sources = sourcesController(db);
  router.get('/sources', sources.list);

  const intel = intelController(db);
  router.get('/intel', intel.list);

  // Internal: only the Python workers (token) may write collected data.
  const ingest = ingestController(db);
  router.post('/ingest', ingestLimiter, internalAuth, ingest.ingest);

  const syncJobs = syncJobsController(db);
  router.get('/sync-jobs', syncJobs.list);
  router.get('/sync-jobs/:id', syncJobs.get);
  // The panel creates jobs (API bound to 127.0.0.1, JSON + CORS required).
  router.post('/sync-jobs', syncJobsLimiter, syncJobs.create);
  // Only the runner reports progress.
  router.patch('/sync-jobs/:id', syncJobsLimiter, internalAuth, syncJobs.update);

  return router;
}
