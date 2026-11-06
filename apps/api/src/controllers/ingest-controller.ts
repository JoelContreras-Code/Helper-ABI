import type { RequestHandler } from 'express';
import { logger } from '../lib/logger.js';
import type { Database } from '../models/index.js';
import { ingestItems } from '../services/ingest-service.js';
import { ingestRequestSchema } from '../validators/ingest.js';

export function ingestController(db: Database) {
  const ingest: RequestHandler = async (req, res) => {
    const request = ingestRequestSchema.parse(req.body);
    const summary = await ingestItems(db, request);
    logger.info(
      `Ingest ${summary.source_key}: ${String(summary.created)} created, ${String(summary.updated)} updated, ${String(summary.duplicates)} duplicates`,
    );
    res.status(summary.created > 0 ? 201 : 200).json(summary);
  };
  return { ingest };
}
