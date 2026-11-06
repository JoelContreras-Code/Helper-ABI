import type { RequestHandler } from 'express';
import type { Database } from '../models/index.js';
import { listSources } from '../services/source-service.js';

export function sourcesController(db: Database) {
  const list: RequestHandler = async (_req, res) => {
    res.json({ sources: await listSources(db) });
  };
  return { list };
}
