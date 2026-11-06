import type { RequestHandler } from 'express';
import type { Database } from '../models/index.js';
import {
  createSyncJob,
  getSyncJob,
  listSyncJobs,
  updateSyncJob,
} from '../services/sync-job-service.js';
import { idParams } from '../validators/common.js';
import {
  createSyncJobSchema,
  listSyncJobsQuerySchema,
  updateSyncJobSchema,
} from '../validators/sync-jobs.js';

export function syncJobsController(db: Database) {
  const create: RequestHandler = async (req, res) => {
    const input = createSyncJobSchema.parse(req.body ?? {});
    res.status(201).json(await createSyncJob(db, input));
  };

  const list: RequestHandler = async (req, res) => {
    const { limit } = listSyncJobsQuerySchema.parse(req.query);
    res.json({ sync_jobs: await listSyncJobs(db, limit) });
  };

  const get: RequestHandler = async (req, res) => {
    const { id } = idParams.parse(req.params);
    res.json(await getSyncJob(db, id));
  };

  const update: RequestHandler = async (req, res) => {
    const { id } = idParams.parse(req.params);
    const input = updateSyncJobSchema.parse(req.body);
    res.json(await updateSyncJob(db, id, input));
  };

  return { create, list, get, update };
}
