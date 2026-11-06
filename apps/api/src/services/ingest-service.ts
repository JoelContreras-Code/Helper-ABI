import { createHash } from 'node:crypto';
import type { Transaction } from 'sequelize';
import { HttpError } from '../lib/http-error.js';
import type { Database, IntelItem } from '../models/index.js';
import type { IngestItemInput, IngestRequest } from '../validators/ingest.js';

export interface IngestSummary {
  source_key: string;
  received: number;
  created: number;
  updated: number;
  duplicates: number;
}

/** Change detection hash (docs/06-intel-pipeline.md §3). */
export function computeContentHash(item: IngestItemInput): string {
  const fingerprint = JSON.stringify([
    item.canonical_url,
    item.title,
    item.description ?? null,
    item.content_excerpt ?? null,
    item.published_at ?? null,
    item.primary_category,
    item.content_type,
  ]);
  return createHash('sha256').update(fingerprint, 'utf8').digest('hex');
}

function toAttributes(item: IngestItemInput, contentHash: string) {
  return {
    canonicalUrl: item.canonical_url,
    title: item.title,
    description: item.description ?? null,
    contentExcerpt: item.content_excerpt ?? null,
    contentType: item.content_type,
    primaryCategory: item.primary_category,
    language: item.language ?? null,
    authorOrChannel: item.author_or_channel ?? null,
    publishedAt: item.published_at ? new Date(item.published_at) : null,
    gameVersion: item.game_version ?? null,
    season: item.season ?? null,
    thumbnailUrl: item.thumbnail_url ?? null,
    metadataJson: item.metadata ?? null,
    contentHash,
  };
}

async function addMissingTags(
  db: Database,
  intelItem: IntelItem,
  tags: string[],
  transaction: Transaction,
): Promise<void> {
  if (tags.length === 0) return;
  const existing = await db.models.IntelItemTag.findAll({
    where: { intelItemId: intelItem.id },
    transaction,
  });
  const known = new Set(existing.map((t) => t.tag));
  const missing = [...new Set(tags)].filter((tag) => !known.has(tag));
  if (missing.length > 0) {
    await db.models.IntelItemTag.bulkCreate(
      missing.map((tag) => ({ intelItemId: intelItem.id, tag, assignedBy: 'rule' as const })),
      { transaction },
    );
  }
}

/**
 * Stores items sent by a connector. Deduplicates by (source, external_id):
 * - new external_id            -> created
 * - same id, same content hash -> duplicate (nothing changes)
 * - same id, different content -> updated (retrieved_at keeps the first value)
 * Everything runs in one transaction: either the whole batch is saved or nothing.
 */
export async function ingestItems(db: Database, request: IngestRequest): Promise<IngestSummary> {
  const { Source, SyncJob, IntelItem } = db.models;

  const source = await Source.findOne({ where: { key: request.source_key } });
  if (!source) {
    throw new HttpError(404, 'source_not_found', `Unknown source "${request.source_key}"`);
  }
  if (!source.canAutomate) {
    throw new HttpError(
      409,
      'source_not_enabled',
      `Source "${source.key}" is not approved for automation (status=${source.status}, terms_reviewed=${String(source.termsReviewed)}, automation_enabled=${String(source.automationEnabled)})`,
    );
  }
  if (request.sync_job_id !== undefined) {
    const job = await SyncJob.findByPk(request.sync_job_id);
    if (job?.status !== 'running') {
      throw new HttpError(409, 'sync_job_not_running', 'The sync job does not exist or is not running');
    }
  }

  const summary: IngestSummary = {
    source_key: source.key,
    received: request.items.length,
    created: 0,
    updated: 0,
    duplicates: 0,
  };

  await db.sequelize.transaction(async (transaction) => {
    for (const item of request.items) {
      const contentHash = computeContentHash(item);
      const attributes = toAttributes(item, contentHash);
      const existing = await IntelItem.findOne({
        where: { sourceId: source.id, externalId: item.external_id },
        transaction,
      });

      let stored: IntelItem;
      if (!existing) {
        stored = await IntelItem.create(
          {
            ...attributes,
            sourceId: source.id,
            externalId: item.external_id,
            retrievedAt: new Date(item.retrieved_at),
          },
          { transaction },
        );
        summary.created += 1;
      } else if (existing.contentHash === contentHash) {
        stored = existing;
        summary.duplicates += 1;
      } else {
        stored = await existing.update(attributes, { transaction });
        summary.updated += 1;
      }
      await addMissingTags(db, stored, item.tags, transaction);
    }
  });

  return summary;
}
