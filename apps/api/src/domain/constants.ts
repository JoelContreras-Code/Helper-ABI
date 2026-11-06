/**
 * Controlled vocabularies shared by models, validators and seeders.
 * See docs/03-data-governance.md and docs/06-intel-pipeline.md.
 */

export const SOURCE_TYPES = [
  'official',
  'community_database',
  'community_guide',
  'video',
  'forum',
  'social',
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const TRUST_LEVELS = ['A', 'B', 'C', 'D', 'E'] as const;
export type TrustLevel = (typeof TRUST_LEVELS)[number];

export const ACCESS_METHODS = ['api', 'rss', 'json', 'html', 'manual'] as const;
export type AccessMethod = (typeof ACCESS_METHODS)[number];

export const SOURCE_STATUSES = [
  'active',
  'unavailable',
  'restricted',
  'deprecated',
  'pending_review',
] as const;
export type SourceStatus = (typeof SOURCE_STATUSES)[number];

export const SYNC_STATE_STATUSES = ['idle', 'success', 'failed'] as const;
export type SyncStateStatus = (typeof SYNC_STATE_STATUSES)[number];

export const SYNC_TRIGGERS = ['manual', 'scheduled'] as const;
export type SyncTrigger = (typeof SYNC_TRIGGERS)[number];

export const SYNC_JOB_STATUSES = ['queued', 'running', 'success', 'partial', 'failed'] as const;
export type SyncJobStatus = (typeof SYNC_JOB_STATUSES)[number];
export const ACTIVE_SYNC_JOB_STATUSES: readonly SyncJobStatus[] = ['queued', 'running'];

export const SYNC_RESULT_STATUSES = ['success', 'failed', 'skipped'] as const;
export type SyncResultStatus = (typeof SYNC_RESULT_STATUSES)[number];

export const CONTENT_TYPES = ['article', 'announcement', 'patch_notes', 'video', 'post'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CATEGORIES = [
  'patch_notes',
  'official_news',
  'events',
  'season_updates',
  'bans_notices',
  'tier_lists',
  'weapon_builds',
  'ammo_guides',
  'armor_guides',
  'map_guides',
  'tactical_guides',
  'economy_guides',
  'videos',
  'community_discussion',
  'bug_reports',
  'tournaments',
  'other',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const VERIFICATION_STATUSES = [
  'pending',
  'verified',
  'corroborated',
  'disputed',
  'unverified',
  'obsolete',
  'rejected',
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const PROCESSING_STATUSES = [
  'new',
  'classified',
  'summarized',
  'needs_review',
  'failed',
] as const;
export type ProcessingStatus = (typeof PROCESSING_STATUSES)[number];

export const TAG_ASSIGNERS = ['rule', 'llm', 'operator'] as const;
export type TagAssigner = (typeof TAG_ASSIGNERS)[number];

/** Limits that protect the database from oversized third-party content. */
export const LIMITS = {
  ingestItemsPerRequest: 200,
  titleLength: 500,
  descriptionLength: 4000,
  excerptLength: 2000,
  urlLength: 1000,
  tagsPerItem: 10,
  tagLength: 48,
  metadataBytes: 8000,
} as const;
