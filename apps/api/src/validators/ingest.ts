import { z } from 'zod';
import { CATEGORIES, CONTENT_TYPES, LIMITS } from '../domain/constants.js';
import { httpUrl, isoDateTime, optionalText, sourceKey } from './common.js';

const metadataSchema = z
  .record(z.string(), z.unknown())
  .refine((value) => JSON.stringify(value).length <= LIMITS.metadataBytes, {
    message: `metadata must be at most ${String(LIMITS.metadataBytes)} bytes once serialized`,
  });

/** One collected item as sent by a Python connector (POST /api/ingest). */
export const ingestItemSchema = z.strictObject({
  external_id: z.string().trim().min(1).max(255),
  canonical_url: httpUrl,
  title: z.string().trim().min(1).max(LIMITS.titleLength),
  description: optionalText(LIMITS.descriptionLength),
  content_excerpt: optionalText(LIMITS.excerptLength),
  content_type: z.enum(CONTENT_TYPES),
  primary_category: z.enum(CATEGORIES).default('other'),
  tags: z
    .array(
      z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9_-]+$/, 'tags may only contain a-z, 0-9, "_" and "-"')
        .max(LIMITS.tagLength),
    )
    .max(LIMITS.tagsPerItem)
    .default([]),
  language: z.string().max(16).nullish(),
  author_or_channel: optionalText(200),
  published_at: isoDateTime.nullish(),
  retrieved_at: isoDateTime,
  game_version: z.string().max(32).nullish(),
  season: z.string().max(64).nullish(),
  thumbnail_url: httpUrl.nullish(),
  metadata: metadataSchema.nullish(),
});

export const ingestRequestSchema = z
  .strictObject({
    source_key: sourceKey,
    sync_job_id: z.number().int().positive().optional(),
    items: z.array(ingestItemSchema).min(1).max(LIMITS.ingestItemsPerRequest),
  })
  .refine((body) => new Set(body.items.map((i) => i.external_id)).size === body.items.length, {
    message: 'external_id values must be unique within one request',
    path: ['items'],
  });

export type IngestItemInput = z.infer<typeof ingestItemSchema>;
export type IngestRequest = z.infer<typeof ingestRequestSchema>;
