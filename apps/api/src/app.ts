import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { requireJson } from './middlewares/require-json.js';
import type { Database } from './models/index.js';
import { createApiRouter, DEFAULT_RATE_LIMITS, type RateLimits } from './routes/index.js';
import { healthRouter } from './routes/health.js';

export interface AppDependencies {
  env: Env;
  db: Database;
  rateLimits?: RateLimits;
}

/** Builds the Express app without starting it (so tests can run it on a random port). */
export function createApp({ env, db, rateLimits = DEFAULT_RATE_LIMITS }: AppDependencies): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.WEB_ORIGIN }));
  app.use(requireJson);
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/health', healthRouter);
  app.use('/api', createApiRouter(db, env.INGEST_TOKEN, rateLimits));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
