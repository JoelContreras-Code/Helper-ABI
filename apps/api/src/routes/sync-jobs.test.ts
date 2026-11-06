import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import type { Database } from '../models/index.js';
import { deriveFinalStatus, STALE_JOB_AFTER_MS } from '../services/sync-job-service.js';
import {
  apiClient,
  createTestDb,
  createTestSource,
  ingestItem,
  startServer,
  TEST_TOKEN,
  testEnv,
  type TestServer,
} from '../test/helpers.js';

let db: Database;
let server: TestServer;
let request: ReturnType<typeof apiClient>;

beforeAll(async () => {
  db = await createTestDb();
  server = await startServer(
    createApp({
      env: testEnv(),
      db,
      rateLimits: { ingestPerMinute: 1000, syncJobsPerMinute: 1000 },
    }),
  );
  request = apiClient(server.baseUrl);
});

afterAll(async () => {
  await server.close();
  await db.sequelize.close();
});

beforeEach(async () => {
  await db.models.IntelItem.destroy({ where: {} });
  await db.models.SyncJob.destroy({ where: {} });
  await db.models.Source.destroy({ where: {} });
  const steam = await createTestSource(db, { key: 'steam_news' });
  const official = await createTestSource(db, { key: 'official_cms' });
  for (const source of [steam, official]) {
    await db.models.SourceSyncState.create({
      sourceId: source.id,
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastSeenPublishedAt: null,
      cursor: 'cursor-0',
      lastError: null,
    });
  }
});

const createJob = () => request('POST', '/api/sync-jobs', { body: {} });
/** token = null sends no Authorization header. */
const patchJob = (id: unknown, body: unknown, token: string | null = TEST_TOKEN) =>
  request('PATCH', `/api/sync-jobs/${String(id)}`, {
    body,
    ...(token !== null ? { token } : {}),
  });

async function syncState(key: string) {
  const source = await db.models.Source.findOne({
    where: { key },
    include: [{ model: db.models.SourceSyncState, as: 'syncState' }],
  });
  return source?.syncState;
}

describe('deriveFinalStatus', () => {
  it.each([
    [[], 'failed'],
    [['success', 'success'], 'success'],
    [['success', 'skipped'], 'success'],
    [['success', 'failed'], 'partial'],
    [['failed', 'failed'], 'failed'],
  ])('%j -> %s', (statuses, expected) => {
    expect(deriveFinalStatus(statuses)).toBe(expected);
  });
});

describe('/api/sync-jobs lifecycle', () => {
  it('creates a queued job and allows only one active job', async () => {
    const created = await createJob();
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ status: 'queued', trigger: 'manual', results: [] });

    const second = await createJob();
    expect(second.status).toBe(409);
    expect(second.body).toMatchObject({
      error: 'sync_job_in_progress',
      sync_job_id: created.body.id,
    });
  });

  it('only the runner (token) can report progress', async () => {
    const { body: job } = await createJob();
    const response = await patchJob(job.id, { status: 'running' }, null);
    expect(response.status).toBe(401);
  });

  it('marks a job partial when one source fails, and only moves the successful cursor', async () => {
    const { body: job } = await createJob();
    const running = await patchJob(job.id, { status: 'running' });
    expect(running.body).toMatchObject({ status: 'running' });
    expect(running.body.started_at).not.toBeNull();

    // While running, the runner can ingest tied to this job.
    const ingest = await request('POST', '/api/ingest', {
      token: TEST_TOKEN,
      body: { source_key: 'steam_news', sync_job_id: job.id, items: [ingestItem()] },
    });
    expect(ingest.status).toBe(201);

    const finished = await patchJob(job.id, {
      status: 'finished',
      results: [
        {
          source_key: 'steam_news',
          status: 'success',
          items_created: 1,
          cursor: 'cursor-1',
          last_seen_published_at: '2026-11-01T10:00:00Z',
          duration_ms: 1200,
        },
        { source_key: 'official_cms', status: 'failed', error: 'HTTP 503', duration_ms: 800 },
      ],
    });
    expect(finished.status).toBe(200);
    expect(finished.body).toMatchObject({ status: 'partial' });
    expect(finished.body.finished_at).not.toBeNull();
    expect(finished.body.results).toHaveLength(2);

    const steam = await syncState('steam_news');
    expect(steam?.cursor).toBe('cursor-1');
    expect(steam?.status).toBe('success');
    expect(steam?.consecutiveFailures).toBe(0);

    const official = await syncState('official_cms');
    expect(official?.cursor).toBe('cursor-0');
    expect(official?.status).toBe('failed');
    expect(official?.lastError).toBe('HTTP 503');
    expect(official?.consecutiveFailures).toBe(1);
  });

  it('marks a job success only when every source succeeded', async () => {
    const { body: job } = await createJob();
    await patchJob(job.id, { status: 'running' });
    const finished = await patchJob(job.id, {
      status: 'finished',
      results: [
        { source_key: 'steam_news', status: 'success' },
        { source_key: 'official_cms', status: 'skipped' },
      ],
    });
    expect(finished.body).toMatchObject({ status: 'success', error: null });
  });

  it('marks a job failed when the runner finishes without results', async () => {
    const { body: job } = await createJob();
    const finished = await patchJob(job.id, { status: 'finished' });
    expect(finished.body).toMatchObject({ status: 'failed' });
    expect(finished.body.error).toMatch(/without reporting results/);
  });

  it('records a runner crash', async () => {
    const { body: job } = await createJob();
    const failed = await patchJob(job.id, { status: 'failed', error: 'Python crashed' });
    expect(failed.body).toMatchObject({ status: 'failed', error: 'Python crashed' });
  });

  it('refuses updates to a finished job and unknown sources', async () => {
    const { body: job } = await createJob();
    const unknown = await patchJob(job.id, {
      status: 'running',
      results: [{ source_key: 'nope', status: 'success' }],
    });
    expect(unknown.status).toBe(422);

    await patchJob(job.id, { status: 'failed', error: 'stop' });
    const late = await patchJob(job.id, { status: 'running' });
    expect(late.status).toBe(409);
    expect(late.body.error).toBe('sync_job_finished');
  });

  it('auto-fails abandoned jobs so a new sync can start', async () => {
    const old = await db.models.SyncJob.create({
      trigger: 'scheduled',
      rangeFrom: null,
      startedAt: null,
      finishedAt: null,
      error: null,
    });
    await db.models.SyncJob.update(
      { createdAt: new Date(Date.now() - STALE_JOB_AFTER_MS - 60_000) },
      { where: { id: old.id }, silent: true },
    );

    const created = await createJob();
    expect(created.status).toBe(201);
    await old.reload();
    expect(old.status).toBe('failed');
  });

  it('lists jobs newest first and returns 404 / 400 for bad ids', async () => {
    const { body: job } = await createJob();
    const list = await request('GET', '/api/sync-jobs?limit=5');
    expect(list.status).toBe(200);
    expect((list.body.sync_jobs as { id: number }[])[0]?.id).toBe(job.id);

    expect((await request('GET', '/api/sync-jobs/999')).status).toBe(404);
    expect((await request('GET', '/api/sync-jobs/abc')).status).toBe(400);
    expect((await request('GET', '/api/sync-jobs?limit=500')).status).toBe(400);
  });
});
