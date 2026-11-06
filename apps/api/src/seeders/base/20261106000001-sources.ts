import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ROOT_DIR } from '../../config/env.js';
import type { Seeder } from '../../db/migrator.js';
import { sourceCatalogSchema } from '../../validators/source-catalog.js';

export const SOURCE_CATALOG_PATH = resolve(ROOT_DIR, 'data/knowledge/sources.json');

/**
 * Upserts the approved source catalog. Idempotent: running it again only
 * updates changed fields. Sources missing from the file are NOT deleted
 * (history is preserved); they are reported so the operator can decide.
 */
export const up: Seeder = async ({ context: { db } }) => {
  const raw: unknown = JSON.parse(await readFile(SOURCE_CATALOG_PATH, 'utf-8'));
  const catalog = sourceCatalogSchema.parse(raw);
  const { Source, SourceSyncState } = db.models;

  await db.sequelize.transaction(async (transaction) => {
    for (const entry of catalog.sources) {
      const values = {
        key: entry.key,
        name: entry.name,
        baseUrl: entry.base_url,
        sourceType: entry.source_type,
        trustLevel: entry.trust_level,
        accessMethod: entry.access_method,
        gameVersion: entry.game_version,
        region: entry.region,
        language: entry.language,
        status: entry.status,
        termsReviewed: entry.terms_reviewed,
        automationEnabled: entry.automation_enabled,
        notes: entry.notes,
      };
      const existing = await Source.findOne({ where: { key: entry.key }, transaction });
      const source = existing
        ? await existing.update(values, { transaction })
        : await Source.create(values, { transaction });
      await SourceSyncState.findOrCreate({
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
    }
  });
};

// Base data is never removed automatically.
