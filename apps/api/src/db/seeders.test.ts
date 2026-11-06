import { readFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Database } from '../models/index.js';
import { SOURCE_CATALOG_PATH } from '../seeders/base/20261106000001-sources.js';
import { DUMMY_SOURCE_KEY } from '../seeders/dev/20261106000001-dummy-intel.js';
import { createTestDb } from '../test/helpers.js';
import { sourceCatalogSchema } from '../validators/source-catalog.js';
import { createSeeder } from './migrator.js';

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
});

afterEach(async () => {
  await db.sequelize.close();
});

async function readCatalog() {
  return sourceCatalogSchema.parse(JSON.parse(await readFile(SOURCE_CATALOG_PATH, 'utf-8')));
}

describe('base seeder: source catalog', () => {
  it('loads every approved source with its sync state', async () => {
    const catalog = await readCatalog();
    await createSeeder(db, 'base', 'test').up();

    expect(await db.models.Source.count()).toBe(catalog.sources.length);
    expect(await db.models.SourceSyncState.count()).toBe(catalog.sources.length);

    const steam = await db.models.Source.findOne({ where: { key: 'steam_news' } });
    expect(steam?.canAutomate).toBe(true);
    const reddit = await db.models.Source.findOne({ where: { key: 'reddit' } });
    expect(reddit?.canAutomate).toBe(false);
  });

  it('is idempotent (running twice does not duplicate)', async () => {
    const catalog = await readCatalog();
    await createSeeder(db, 'base', 'test').up();
    await createSeeder(db, 'base', 'test').up();
    expect(await db.models.Source.count()).toBe(catalog.sources.length);
    expect(await db.models.SourceSyncState.count()).toBe(catalog.sources.length);
  });

  it('only enables automation for reviewed, active, non-manual sources', async () => {
    const catalog = await readCatalog();
    for (const source of catalog.sources.filter((s) => s.automation_enabled)) {
      expect(source.terms_reviewed).toBe(true);
      expect(source.status).toBe('active');
      expect(source.access_method).not.toBe('manual');
    }
  });

  it('rejects a catalog that automates an unreviewed source', () => {
    const result = sourceCatalogSchema.safeParse({
      schema_version: 1,
      game: 'Arena Breakout: Infinite',
      platform: 'PC',
      verified_at: '2026-11-06',
      verified_by: 'test',
      sources: [
        {
          key: 'bad_source',
          name: 'Bad',
          base_url: 'https://example.com/',
          source_type: 'official',
          trust_level: 'A',
          access_method: 'api',
          game_version: 'PC',
          region: null,
          language: 'en',
          status: 'active',
          terms_reviewed: false,
          automation_enabled: true,
          notes: null,
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a catalog for another game or platform', () => {
    const result = sourceCatalogSchema.safeParse({
      schema_version: 1,
      game: 'Arena Breakout',
      platform: 'Mobile',
      verified_at: '2026-11-06',
      verified_by: 'test',
      sources: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('dev seeder: dummy data', () => {
  it('creates DUMMY_ items and removes them completely on undo', async () => {
    const seeder = createSeeder(db, 'dev', 'development');
    await seeder.up();

    const items = await db.models.IntelItem.findAll();
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.title.startsWith('DUMMY_'))).toBe(true);
    expect(await db.models.IntelItemTag.count()).toBe(items.length);

    await seeder.down({ to: 0 });
    expect(await db.models.IntelItem.count()).toBe(0);
    expect(await db.models.IntelItemTag.count()).toBe(0);
    expect(await db.models.Source.count({ where: { key: DUMMY_SOURCE_KEY } })).toBe(0);
  });

  it('refuses to run in production', async () => {
    await expect(createSeeder(db, 'dev', 'production').up()).rejects.toThrow(/production/);
    expect(await db.models.IntelItem.count()).toBe(0);
  });
});
