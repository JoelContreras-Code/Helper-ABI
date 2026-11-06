import type { IntelItem, Source, SourceSyncState, SyncJob, SyncJobResult } from '../models/index.js';

// The public API uses snake_case JSON, same as the payloads sent by the Python workers.

const iso = (date: Date | null | undefined): string | null => (date ? date.toISOString() : null);

export function serializeSyncState(state: SourceSyncState | undefined | null) {
  if (!state) return null;
  return {
    status: state.status,
    last_attempt_at: iso(state.lastAttemptAt),
    last_success_at: iso(state.lastSuccessAt),
    last_seen_published_at: iso(state.lastSeenPublishedAt),
    last_error: state.lastError,
    consecutive_failures: state.consecutiveFailures,
  };
}

export function serializeSource(source: Source) {
  return {
    key: source.key,
    name: source.name,
    base_url: source.baseUrl,
    source_type: source.sourceType,
    trust_level: source.trustLevel,
    access_method: source.accessMethod,
    game_version: source.gameVersion,
    region: source.region,
    language: source.language,
    status: source.status,
    terms_reviewed: source.termsReviewed,
    automation_enabled: source.automationEnabled,
    can_automate: source.canAutomate,
    notes: source.notes,
    sync_state: serializeSyncState(source.syncState),
  };
}

export function serializeIntelItem(item: IntelItem) {
  return {
    id: item.id,
    source: item.source
      ? { key: item.source.key, name: item.source.name, trust_level: item.source.trustLevel }
      : null,
    external_id: item.externalId,
    canonical_url: item.canonicalUrl,
    title: item.title,
    description: item.description,
    content_excerpt: item.contentExcerpt,
    content_type: item.contentType,
    primary_category: item.primaryCategory,
    tags: (item.tags ?? []).map((t) => t.tag).sort(),
    language: item.language,
    author_or_channel: item.authorOrChannel,
    published_at: iso(item.publishedAt),
    retrieved_at: iso(item.retrievedAt),
    game_version: item.gameVersion,
    season: item.season,
    verification_status: item.verificationStatus,
    processing_status: item.processingStatus,
    thumbnail_url: item.thumbnailUrl,
  };
}

export function serializeSyncJobResult(result: SyncJobResult) {
  return {
    source_key: result.source?.key ?? null,
    status: result.status,
    items_created: result.itemsCreated,
    items_updated: result.itemsUpdated,
    duplicates_skipped: result.duplicatesSkipped,
    error: result.error,
    duration_ms: result.durationMs,
  };
}

export function serializeSyncJob(job: SyncJob) {
  const durationMs =
    job.startedAt && job.finishedAt ? job.finishedAt.getTime() - job.startedAt.getTime() : null;
  return {
    id: job.id,
    trigger: job.trigger,
    status: job.status,
    range_from: iso(job.rangeFrom),
    created_at: iso(job.createdAt),
    started_at: iso(job.startedAt),
    finished_at: iso(job.finishedAt),
    duration_ms: durationMs,
    error: job.error,
    results: (job.results ?? []).map(serializeSyncJobResult),
  };
}
