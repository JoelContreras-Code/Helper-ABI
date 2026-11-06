import type { RequestHandler } from 'express';
import type { Database } from '../models/index.js';
import { listIntel } from '../services/intel-service.js';
import { listIntelQuerySchema } from '../validators/intel.js';

export function intelController(db: Database) {
  const list: RequestHandler = async (req, res) => {
    const query = listIntelQuerySchema.parse(req.query);
    res.json(await listIntel(db, query));
  };
  return { list };
}
