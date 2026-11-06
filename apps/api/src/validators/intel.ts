import { z } from 'zod';
import { CATEGORIES } from '../domain/constants.js';
import { sourceKey } from './common.js';

/** GET /api/intel query string. */
export const listIntelQuerySchema = z.object({
  source: sourceKey.optional(),
  category: z.enum(CATEGORIES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});

export type ListIntelQuery = z.infer<typeof listIntelQuerySchema>;
