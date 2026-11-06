import { afterEach, describe, expect, it } from 'vitest';
import { initModels, type Database } from '../models/index.js';
import { createTestSource, testEnv } from '../test/helpers.js';
import { createMigrator } from './migrator.js';
import { createSequelize } from './sequelize.js';

const EXPECTED_TABLES = [
  'intel_item_tags',
  'intel_items',
  'source_sync_states',
  'sources',
  'sync_job_results',
  'sync_jobs',
];

let db: Database | undefined;

afterEach(async () => {
  await db?.sequelize.close();
  db = undefined;
});

async function tables(database: Database): Promise<string[]> {
  const names = await database.sequelize.getQueryInterface().showAllTables();
  return names.filter((name) => name !== 'SequelizeMeta').sort();
}

describe('migrations', () => {
  it('apply, revert completely and apply again (reversible)', async () => {
    db = initModels(createSequelize(testEnv()));
    const migrator = createMigrator(db.sequelize);

    await migrator.up();
    expect(await tables(db)).toEqual(EXPECTED_TABLES);
    expect(await migrator.pending()).toHaveLength(0);

    await migrator.down({ to: 0 });
    expect(await tables(db)).toEqual([]);

    await migrator.up();
    expect(await tables(db)).toEqual(EXPECTED_TABLES);
  });

  it('enforce foreign keys', async () => {
    db = initModels(createSequelize(testEnv()));
    await createMigrator(db.sequelize).up();
    await expect(
      db.models.SourceSyncState.create({
        sourceId: 9999,
        lastAttemptAt: null,
        lastSuccessAt: null,
        lastSeenPublishedAt: null,
        cursor: null,
        lastError: null,
      }),
    ).rejects.toThrow(/FOREIGN KEY/i);
  });

  it('refuse deleting a source that has collected items (history is kept)', async () => {
    db = initModels(createSequelize(testEnv()));
    await createMigrator(db.sequelize).up();
    const source = await createTestSource(db);
    await db.models.IntelItem.create({
      sourceId: source.id,
      externalId: 'x',
      canonicalUrl: 'https://example.com/x',
      title: 'x',
      description: null,
      contentExcerpt: null,
      contentType: 'article',
      language: null,
      authorOrChannel: null,
      publishedAt: null,
      retrievedAt: new Date(),
      gameVersion: null,
      season: null,
      contentHash: 'h',
      thumbnailUrl: null,
      metadataJson: null,
    });
    await expect(source.destroy()).rejects.toThrow(/FOREIGN KEY/i);
  });

  it('enforce one item per (source, external_id)', async () => {
    db = initModels(createSequelize(testEnv()));
    await createMigrator(db.sequelize).up();
    const source = await createTestSource(db);
    const item = {
      sourceId: source.id,
      externalId: 'same',
      canonicalUrl: 'https://example.com/a',
      title: 'a',
      description: null,
      contentExcerpt: null,
      contentType: 'article' as const,
      language: null,
      authorOrChannel: null,
      publishedAt: null,
      retrievedAt: new Date(),
      gameVersion: null,
      season: null,
      contentHash: 'h',
      thumbnailUrl: null,
      metadataJson: null,
    };
    await db.models.IntelItem.create(item);
    await expect(db.models.IntelItem.create(item)).rejects.toThrow();
  });
});
