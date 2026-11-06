import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { createSeeder } from '../db/migrator.js';
import type { Database } from '../models/index.js';
import {
  apiClient,
  createTestDb,
  ingestItem,
  startServer,
  TEST_TOKEN,
  testEnv,
  type TestServer,
} from '../test/helpers.js';

let db: Database;
let server: TestServer;
let request: ReturnType<typeof apiClient>;

interface IntelListBody {
  items: {
    external_id: string;
    source: { key: string };
    tags: string[];
    published_at: string | null;
  }[];
  total: number;
}

beforeAll(async () => {
  db = await createTestDb();
  await createSeeder(db, 'base', 'test').up();
  server = await startServer(createApp({ env: testEnv(), db }));
  request = apiClient(server.baseUrl);

  await request('POST', '/api/ingest', {
    token: TEST_TOKEN,
    body: {
      source_key: 'steam_news',
      items: [
        ingestItem({ external_id: 's-old', published_at: '2026-10-01T00:00:00Z' }),
        ingestItem({
          external_id: 's-new',
          published_at: '2026-11-05T00:00:00Z',
          primary_category: 'events',
          tags: ['halloween'],
        }),
        ingestItem({ external_id: 's-nodate', published_at: null }),
      ],
    },
  });
  await request('POST', '/api/ingest', {
    token: TEST_TOKEN,
    body: {
      source_key: 'official_cms',
      items: [ingestItem({ external_id: 'o-1', published_at: '2026-11-03T00:00:00Z' })],
    },
  });
});

afterAll(async () => {
  await server.close();
  await db.sequelize.close();
});

describe('GET /api/intel', () => {
  it('lists newest first, undated items last', async () => {
    const response = await request('GET', '/api/intel');
    const body = response.body as unknown as IntelListBody;
    expect(response.status).toBe(200);
    expect(body.total).toBe(4);
    expect(body.items.map((i) => i.external_id)).toEqual(['s-new', 'o-1', 's-old', 's-nodate']);
    expect(body.items[0]?.tags).toEqual(['halloween']);
  });

  it('filters by source and category', async () => {
    const bySource = (await request('GET', '/api/intel?source=official_cms'))
      .body as unknown as IntelListBody;
    expect(bySource.total).toBe(1);
    expect(bySource.items[0]?.source.key).toBe('official_cms');

    const byCategory = (await request('GET', '/api/intel?category=events'))
      .body as unknown as IntelListBody;
    expect(byCategory.items.map((i) => i.external_id)).toEqual(['s-new']);
  });

  it('paginates', async () => {
    const page = (await request('GET', '/api/intel?limit=2&offset=2'))
      .body as unknown as IntelListBody;
    expect(page.total).toBe(4);
    expect(page.items.map((i) => i.external_id)).toEqual(['s-old', 's-nodate']);
  });

  it('validates the query string', async () => {
    expect((await request('GET', '/api/intel?limit=1000')).status).toBe(400);
    expect((await request('GET', '/api/intel?category=hacks')).status).toBe(400);
  });
});

describe('GET /api/sources', () => {
  it('lists the catalog with sync state and automation flag', async () => {
    const response = await request('GET', '/api/sources');
    const sources = response.body.sources as {
      key: string;
      can_automate: boolean;
      sync_state: { status: string } | null;
    }[];
    expect(response.status).toBe(200);
    const steam = sources.find((s) => s.key === 'steam_news');
    expect(steam?.can_automate).toBe(true);
    expect(steam?.sync_state?.status).toBe('idle');
    expect(sources.find((s) => s.key === 'senseos')?.can_automate).toBe(false);
  });
});
