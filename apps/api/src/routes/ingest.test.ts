import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import type { Database } from '../models/index.js';
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
  await createTestSource(db);
});

/** token = null sends no Authorization header. */
const ingest = (body: unknown, token: string | null = TEST_TOKEN) =>
  request('POST', '/api/ingest', { body, ...(token !== null ? { token } : {}) });

describe('POST /api/ingest — authentication', () => {
  it('rejects requests without token', async () => {
    const response = await ingest({ source_key: 'test_source', items: [ingestItem()] }, null);
    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toBe('Bearer');
  });

  it('rejects a wrong token', async () => {
    const response = await ingest(
      { source_key: 'test_source', items: [ingestItem()] },
      'wrong-token-wrong-token-wrong-token',
    );
    expect(response.status).toBe(401);
    expect(await db.models.IntelItem.count()).toBe(0);
  });
});

describe('POST /api/ingest — validation', () => {
  it.each([
    ['javascript: URL', { canonical_url: 'javascript:alert(1)' }],
    ['data: URL', { canonical_url: 'data:text/html,hi' }],
    ['empty title', { title: '   ' }],
    ['unknown content type', { content_type: 'meme' }],
    ['unknown category', { primary_category: 'hacks' }],
    ['date without timezone', { published_at: '2026-11-01 10:00' }],
    ['unknown field (typo)', { titel: 'typo' }],
    ['tag with spaces', { tags: ['not valid'] }],
  ])('rejects %s', async (_label, override) => {
    const response = await ingest({ source_key: 'test_source', items: [ingestItem(override)] });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation_error');
  });

  it('rejects duplicated external ids in the same batch', async () => {
    const response = await ingest({
      source_key: 'test_source',
      items: [ingestItem(), ingestItem({ title: 'other' })],
    });
    expect(response.status).toBe(400);
  });

  it('rejects batches above 200 items', async () => {
    const items = Array.from({ length: 201 }, (_, i) =>
      ingestItem({ external_id: `id-${String(i)}` }),
    );
    const response = await ingest({ source_key: 'test_source', items });
    expect(response.status).toBe(400);
  });
});

describe('POST /api/ingest — source rules', () => {
  it('returns 404 for an unknown source', async () => {
    const response = await ingest({ source_key: 'nope', items: [ingestItem()] });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('source_not_found');
  });

  it.each([
    ['automation disabled', { automationEnabled: false }],
    ['terms not reviewed', { termsReviewed: false }],
    ['restricted source', { status: 'restricted' as const }],
  ])('refuses a source with %s', async (_label, override) => {
    await createTestSource(db, { key: 'blocked_source', ...override });
    const response = await ingest({ source_key: 'blocked_source', items: [ingestItem()] });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('source_not_enabled');
  });

  it('refuses a sync_job_id that is not running', async () => {
    const response = await ingest({
      source_key: 'test_source',
      sync_job_id: 999,
      items: [ingestItem()],
    });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('sync_job_not_running');
  });
});

describe('POST /api/ingest — deduplication', () => {
  it('creates, then counts duplicates, then detects updates', async () => {
    const first = await ingest({
      source_key: 'test_source',
      items: [ingestItem({ tags: ['Season-7', 'patch'] }), ingestItem({ external_id: 'item-2' })],
    });
    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ received: 2, created: 2, updated: 0, duplicates: 0 });

    const again = await ingest({ source_key: 'test_source', items: [ingestItem()] });
    expect(again.status).toBe(200);
    expect(again.body).toMatchObject({ created: 0, updated: 0, duplicates: 1 });

    const changed = await ingest({
      source_key: 'test_source',
      items: [
        ingestItem({ title: 'Patch notes 1.0 (corrected)', retrieved_at: '2026-11-07T12:00:00Z' }),
      ],
    });
    expect(changed.body).toMatchObject({ created: 0, updated: 1, duplicates: 0 });

    const stored = await db.models.IntelItem.findOne({
      where: { externalId: 'item-1' },
      include: [{ model: db.models.IntelItemTag, as: 'tags' }],
    });
    expect(stored?.title).toBe('Patch notes 1.0 (corrected)');
    // retrieved_at keeps the first retrieval date.
    expect(stored?.retrievedAt.toISOString()).toBe('2026-11-06T12:00:00.000Z');
    expect(stored?.verificationStatus).toBe('pending');
    expect(stored?.tags?.map((t) => t.tag).sort()).toEqual(['patch', 'season-7']);
  });

  it('stores text as-is (escaping is the panel job) without executing anything', async () => {
    const title = '<img src=x onerror=alert(1)> Patch';
    await ingest({ source_key: 'test_source', items: [ingestItem({ title })] });
    const stored = await db.models.IntelItem.findOne({ where: { externalId: 'item-1' } });
    expect(stored?.title).toBe(title);
  });
});

describe('POST /api/ingest — rate limit', () => {
  it('answers 429 after the per-minute limit', async () => {
    const limitedDb = await createTestDb();
    const limited = await startServer(
      createApp({
        env: testEnv(),
        db: limitedDb,
        rateLimits: { ingestPerMinute: 2, syncJobsPerMinute: 2 },
      }),
    );
    const limitedRequest = apiClient(limited.baseUrl);
    try {
      const statuses: number[] = [];
      for (let i = 0; i < 3; i += 1) {
        const response = await limitedRequest('POST', '/api/ingest', { body: {}, token: 'bad' });
        statuses.push(response.status);
      }
      expect(statuses).toEqual([401, 401, 429]);
    } finally {
      await limited.close();
      await limitedDb.sequelize.close();
    }
  });
});
