import { z } from 'zod';
import {
  ACCESS_METHODS,
  SOURCE_STATUSES,
  SOURCE_TYPES,
  TRUST_LEVELS,
} from '../domain/constants.js';

const sourceEntrySchema = z
  .object({
    key: z.string().regex(/^[a-z0-9_]{2,64}$/),
    name: z.string().min(1).max(160),
    base_url: z.url({ protocol: /^https$/ }).max(500),
    source_type: z.enum(SOURCE_TYPES),
    trust_level: z.enum(TRUST_LEVELS),
    access_method: z.enum(ACCESS_METHODS),
    game_version: z.string().max(32).nullable(),
    region: z.string().max(32).nullable(),
    language: z.string().max(16).nullable(),
    status: z.enum(SOURCE_STATUSES),
    terms_reviewed: z.boolean(),
    automation_enabled: z.boolean(),
    notes: z.string().nullable(),
  })
  .refine((s) => !s.automation_enabled || (s.terms_reviewed && s.status === 'active'), {
    message: 'automation requires terms_reviewed=true and status=active (docs/05-sources.md §5)',
    path: ['automation_enabled'],
  })
  .refine((s) => !s.automation_enabled || s.access_method !== 'manual', {
    message: 'a manual source cannot be automated',
    path: ['automation_enabled'],
  });

/** Approved source catalog (data/knowledge/sources.json). */
export const sourceCatalogSchema = z
  .object({
    schema_version: z.literal(1),
    game: z.literal('Arena Breakout: Infinite'),
    platform: z.literal('PC'),
    verified_at: z.iso.date(),
    verified_by: z.string().min(1),
    reference: z.string().optional(),
    sources: z.array(sourceEntrySchema).min(1),
  })
  .refine((c) => new Set(c.sources.map((s) => s.key)).size === c.sources.length, {
    message: 'source keys must be unique',
    path: ['sources'],
  });

export type SourceCatalog = z.infer<typeof sourceCatalogSchema>;
