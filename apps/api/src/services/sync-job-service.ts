import { Op, type Transaction } from 'sequelize';
import { ACTIVE_SYNC_JOB_STATUSES, type SyncJobStatus } from '../domain/constants.js';
import { HttpError } from '../lib/http-error.js';
import type { Database, SyncJob } from '../models/index.js';
import type { CreateSyncJobInput, UpdateSyncJobInput } from '../validators/sync-jobs.js';
import { serializeSyncJob } from './serializers.js';

/** A queued/running job older than this is considered abandoned (runner crashed). */
export const STALE_JOB_AFTER_MS = 2 * 60 * 60 * 1000;

function includeResults(db: Database) {
  return [
    {
      model: db.models.SyncJobResult,
      as: 'results',
      include: [{ model: db.models.Source, as: 'source', attributes: ['key'] }],
    },
  ];
}

async function findJobOrFail(db: Database, id: number, transaction?: Transaction): Promise<SyncJob> {
  const job = await db.models.SyncJob.findByPk(id, {
    include: includeResults(db),
    ...(transaction ? { transaction } : {}),
  });
  if (!job) {
    throw new HttpError(404, 'sync_job_not_found', `Sync job ${String(id)} does not exist`);
  }
  return job;
}

/** Marks abandoned jobs as failed so a new sync can start. */
export async function failStaleJobs(db: Database, now = new Date()): Promise<number> {
  const [affected] = await db.models.SyncJob.update(
    { status: 'failed', finishedAt: now, error: 'Abandoned: no update from the runner' },
    {
      where: {
        status: { [Op.in]: [...ACTIVE_SYNC_JOB_STATUSES] },
        createdAt: { [Op.lt]: new Date(now.getTime() - STALE_JOB_AFTER_MS) },
      },
    },
  );
  return affected;
}

/**
 * Creates a queued job. Only one job may be active at a time.
 * (Phase 4 adds the launcher that starts the Python runner for this job.)
 */
export async function createSyncJob(db: Database, input: CreateSyncJobInput) {
  await failStaleJobs(db);
  const active = await db.models.SyncJob.findOne({
    where: { status: { [Op.in]: [...ACTIVE_SYNC_JOB_STATUSES] } },
  });
  if (active) {
    throw new HttpError(409, 'sync_job_in_progress', 'Another sync job is already active', {
      sync_job_id: active.id,
    });
  }
  const job = await db.models.SyncJob.create({
    trigger: input.trigger,
    rangeFrom: input.range_from ? new Date(input.range_from) : null,
    startedAt: null,
    finishedAt: null,
    error: null,
  });
  return serializeSyncJob(await findJobOrFail(db, job.id));
}

export async function listSyncJobs(db: Database, limit: number) {
  const jobs = await db.models.SyncJob.findAll({
    include: includeResults(db),
    order: [['id', 'DESC']],
    limit,
  });
  return jobs.map(serializeSyncJob);
}

export async function getSyncJob(db: Database, id: number) {
  return serializeSyncJob(await findJobOrFail(db, id));
}

/** success if every source succeeded/skipped, failed if all failed, partial otherwise. */
export function deriveFinalStatus(resultStatuses: string[]): SyncJobStatus {
  if (resultStatuses.length === 0) return 'failed';
  const failed = resultStatuses.filter((s) => s === 'failed').length;
  if (failed === 0) return 'success';
  return failed === resultStatuses.length ? 'failed' : 'partial';
}

async function saveResults(
  db: Database,
  job: SyncJob,
  results: UpdateSyncJobInput['results'],
  now: Date,
  transaction: Transaction,
): Promise<void> {
  const { Source, SourceSyncState, SyncJobResult } = db.models;
  for (const result of results) {
    const source = await Source.findOne({ where: { key: result.source_key }, transaction });
    if (!source) {
      throw new HttpError(422, 'unknown_source', `Unknown source "${result.source_key}"`);
    }

    const values = {
      status: result.status,
      itemsCreated: result.items_created,
      itemsUpdated: result.items_updated,
      duplicatesSkipped: result.duplicates_skipped,
      error: result.error ?? null,
      durationMs: result.duration_ms ?? null,
    };
    const existing = await SyncJobResult.findOne({
      where: { syncJobId: job.id, sourceId: source.id },
      transaction,
    });
    if (existing) {
      await existing.update(values, { transaction });
    } else {
      await SyncJobResult.create({ ...values, syncJobId: job.id, sourceId: source.id }, { transaction });
    }

    if (result.status === 'skipped') continue;
    const [state] = await SourceSyncState.findOrCreate({
      where: { sourceId: source.id },
      defaults: {
        sourceId: source.id,
        lastAttemptAt: null,
        lastSuccessAt: null,
        lastSeenPublishedAt: null,
        cursor: null,
        lastError: null,
      },
      transaction,
    });
    if (result.status === 'success') {
      // The cursor only moves forward after a successful save (06 §2).
      await state.update(
        {
          lastAttemptAt: now,
          lastSuccessAt: now,
          status: 'success',
          lastError: null,
          consecutiveFailures: 0,
          ...(result.cursor !== undefined ? { cursor: result.cursor } : {}),
          ...(result.last_seen_published_at
            ? { lastSeenPublishedAt: new Date(result.last_seen_published_at) }
            : {}),
        },
        { transaction },
      );
    } else {
      // Failed: keep the previous cursor so the next run retries.
      await state.update(
        {
          lastAttemptAt: now,
          status: 'failed',
          lastError: result.error ?? 'Unknown error',
          consecutiveFailures: state.consecutiveFailures + 1,
        },
        { transaction },
      );
    }
  }
}

/** Progress / completion reported by the Python runner. */
export async function updateSyncJob(db: Database, id: number, input: UpdateSyncJobInput) {
  const now = new Date();
  await db.sequelize.transaction(async (transaction) => {
    const job = await findJobOrFail(db, id, transaction);
    if (!ACTIVE_SYNC_JOB_STATUSES.includes(job.status)) {
      throw new HttpError(409, 'sync_job_finished', `Sync job ${String(id)} is already ${job.status}`);
    }

    await saveResults(db, job, input.results, now, transaction);

    if (input.status === 'running') {
      await job.update({ status: 'running', startedAt: job.startedAt ?? now }, { transaction });
      return;
    }

    if (input.status === 'failed') {
      await job.update(
        {
          status: 'failed',
          startedAt: job.startedAt ?? now,
          finishedAt: now,
          error: input.error ?? 'Runner reported a failure',
        },
        { transaction },
      );
      return;
    }

    const allResults = await db.models.SyncJobResult.findAll({
      where: { syncJobId: job.id },
      transaction,
    });
    const status = deriveFinalStatus(allResults.map((r) => r.status));
    await job.update(
      {
        status,
        startedAt: job.startedAt ?? now,
        finishedAt: now,
        error:
          input.error ?? (allResults.length === 0 ? 'Runner finished without reporting results' : null),
      },
      { transaction },
    );
  });
  return getSyncJob(db, id);
}
