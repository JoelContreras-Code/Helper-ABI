import { z } from 'zod';
import { SYNC_RESULT_STATUSES, SYNC_TRIGGERS } from '../domain/constants.js';
import { isoDateTime, optionalText, sourceKey } from './common.js';

/** POST /api/sync-jobs (panel button or scheduled task). */
export const createSyncJobSchema = z.strictObject({
  trigger: z.enum(SYNC_TRIGGERS).default('manual'),
  range_from: isoDateTime.nullish(),
});

const syncResultSchema = z.strictObject({
  source_key: sourceKey,
  status: z.enum(SYNC_RESULT_STATUSES),
  items_created: z.number().int().min(0).default(0),
  items_updated: z.number().int().min(0).default(0),
  duplicates_skipped: z.number().int().min(0).default(0),
  error: optionalText(2000),
  duration_ms: z.number().int().min(0).nullish(),
  /** New cursor; only applied when status is "success". */
  cursor: z.string().max(500).nullish(),
  last_seen_published_at: isoDateTime.nullish(),
});

/**
 * PATCH /api/sync-jobs/:id (Python runner).
 * - running: the runner started (results may be reported progressively).
 * - finished: the API derives success / partial / failed from the results,
 *   so a job is never shown as completed when a source failed.
 * - failed: the runner itself crashed.
 */
export const updateSyncJobSchema = z
  .strictObject({
    status: z.enum(['running', 'finished', 'failed']),
    error: optionalText(2000),
    results: z.array(syncResultSchema).max(50).default([]),
  })
  .refine((body) => new Set(body.results.map((r) => r.source_key)).size === body.results.length, {
    message: 'source_key values must be unique within one request',
    path: ['results'],
  });

export const listSyncJobsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateSyncJobInput = z.infer<typeof createSyncJobSchema>;
export type UpdateSyncJobInput = z.infer<typeof updateSyncJobSchema>;
